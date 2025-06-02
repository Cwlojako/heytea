<script setup>
	import { encrypt } from '@/utils/crypto'
	import { showToast } from 'vant'
	import { useRoute, useRouter } from 'vue-router'
	import axios from 'axios'

	const router = useRouter()
	const baseUrl = import.meta.env.VITE_BASE_URL
	const price = ref('')
	const uuid = ref('')
	const phone = ref('')
	const url = ref('')
	const coupon = ref('')
	const couponVisible = ref(false)
	const list = ref([])
	const loading = ref(false)
	const finished = ref(true)
	const pageData = ref({
		page: 1,
		size: 10
	})
	const closeUrlVisible = ref(false)
	const closeUrl = ref('')

	watch(couponVisible, (newVal) => {
		if (newVal) {
			onGetList(false)
		}
	})

	function onGetUuid() {
		uuid.value = Array.from({ length: 16 }, () =>
			Math.floor(Math.random() * 16).toString(16)
		).join('')
	}

	async function onGenerateUrl() {
		const p = encodeURIComponent(encrypt(price.value))
		const ph = encodeURIComponent(encrypt(phone.value))
		let res = `${window.location.origin}/store?u=${uuid.value}&p=${p}&ph=${ph}`
		if (coupon.value) {
			res += `&c=${coupon.value}`
		}
		url.value = res
		let params = {
			uuid: uuid.value,
			price: price.value,
			phone: phone.value,
			couponId: coupon.value || ''
		}
		await axios.post(`${baseUrl}/generateLink`, params)
	}

	function onCopyUrl(text) {
		const textarea = document.createElement('textarea')
		textarea.value = text
		textarea.style.position = 'fixed'
		textarea.style.opacity = '0'
		document.body.appendChild(textarea)
		textarea.select()
		try {
			document.execCommand('copy')
			showToast('已复制')
		} catch (err) {
			showToast('复制失败')
		}
		document.body.removeChild(textarea)
	}

	function loadMore() {
		if (!finished.value) {
			onGetList(true)
		}
	}

	async function onGetList(isNext = false) {
		loading.value = true
		finished.value = false
		if (isNext) {
			pageData.value.page++
		} else {
			pageData.value.page = 1
		}
		let { data: res } = await axios.post(`${baseUrl}/findCoupon?phone=${phone.value}`, pageData.value)
		if (res.code === 200) {
			const { records, total } = res.data
			let _list = isNext ? list.value.concat(records) : records
			_list.forEach(e => {
				e.checked = e.id == coupon.value
				if (e.couponType == 0 && e.thresholdText !== '无门槛') {
					const regex = /(\d+)(\.\d+)?/
					const match = e.thresholdText.match(regex)
					console.log(match && price.value < +match[0])
					if (match && price.value < +match[0]) {
						e.disabled = true
					}
				}
			})
			list.value = _list
			finished.value = _list.length >= total
			loading.value = false
			
		} else {
			showToast({ message: res.message, type: 'fail' })
			loading.value = false
			finished.value = true
		}
	}

	function onCancel() {
		couponVisible.value = false
		list.value = []
	}

	function onConfirm() {
		couponVisible.value = false
		list.value = []
	}

	function onChecked(item) {
		if (item.checked) {
			list.value.filter(i => i.id !== item.id).forEach(i => i.checked = false)
			coupon.value = item.id
		}
	}

	function toAccountSetting() {
		router.push({ name: 'AccountSetting' })
	}

	async function onConfirmCloseUrl() {
		if (!closeUrl.value) {
			showToast('请输入要关闭的链接')
			return
		}
		const queryParams = new URLSearchParams(new URL(closeUrl.value).search)
		const uuid = queryParams.get('u')
		await axios.post(`${baseUrl}/closeLink`, { uuid })
		showToast('链接已关闭')
		closeUrl.value = ''
	}

	const isReady = computed(() => {
		return price.value && uuid.value && phone.value && phone.value.length === 11
	})

	const couponReady = computed(() => {
		return price.value && phone.value && phone.value.length === 11
	})

	const LabelText = computed(() => {
		return (i) => {
			switch (i) {
				case 2:
					return '到店'
				case 3:
					return '外送'
			}
		}
	})
</script>

<template>
	<div class="wrapper">
		<van-field label='UUID' v-model="uuid" readonly>
			<template #button>
				<van-button size="small" type="primary" @click="onGetUuid">获取UUID</van-button>
			</template>
		</van-field>
		<van-field label="价格" v-model="price" type="number" placeholder="请输入喜茶原价"/>
		<van-field label="账号" v-model="phone" type="number" placeholder="请输入手机号账号"/>
		<van-field
			label='优惠券'
			v-model="coupon"
			readonly
			placeholder="优先输入价格"
			:disabled="!couponReady"
		>
			<template #button>
				<div class="btn_box">
					<van-icon class="clear_icon" v-if="coupon" name="clear" size="18" @click="coupon = ''"/>
					<van-button size="small" type="primary" @click="couponVisible = true" :disabled="!couponReady">选择优惠券</van-button>
				</div>
			</template>
		</van-field>

		<van-button type="primary" block style="margin-top: 10px;" :disabled="!isReady" @click="onGenerateUrl">生 成 链 接</van-button>
		<div class="url-box" v-if="url">
			<p class="url">{{ url }}</p>
			<van-button size="small" type="success" @click="onCopyUrl(url)">复制链接</van-button>
		</div>
		
		<van-button type="warning" block style="margin-top: 10px;" @click="toAccountSetting">账 号 管 理</van-button>
		<van-button type="danger" block style="margin-top: 10px;" @click="closeUrlVisible = true">关 闭 链 接</van-button>
		<van-popup v-model:show="couponVisible" position="bottom">
			<div class="popup_content_wrap">
				<div class="list_box">
					<van-list
						v-model:loading="loading"
						:finished="finished"
						finished-text="没有更多了"
						@load="loadMore"
						offset="100"
					>
						<div
							v-for="item in list"
							:key="item.id"
							:class="['list_item', { disabled: item.disabled }]"
						>
							<div v-if="item.disabled" class="disabled-badge">不可用</div>
							<div class="left_area">
								<section>
									<span class="number">{{ item.discountText }}</span>
									<span class="unit">{{ item.discountUnit }}</span>
								</section>
								<section>
									<span class="cond">{{ item.thresholdText }}</span>
								</section>
							</div>
							<div class="right_area">
								<section>
									<div class="name">
										<van-tag plain type="primary" v-if="item.bizLabels.length">{{ LabelText(item.bizLabels[0]) }}</van-tag>
										<span>{{ item.name }}</span>
									</div>
									<div class="time">
										<span>{{ item.period_start }} ~ {{ item.period_end }}</span>
										<p class="expire" v-if="item.soon_expire">{{ item.periodText }}</p>
									</div>
								</section>
								<section>
									<van-checkbox v-model="item.checked" @change="(val) => onChecked(item)" checked-color="#131313" :disabled="item.disabled"></van-checkbox>
								</section>
							</div>
						</div>
					</van-list>
				</div>
				<div class="bottom_btn">
					<van-button @click="onCancel">取 消</van-button>
					<van-button color="#131313" @click="onConfirm">确 认</van-button>
				</div>
			</div>
		</van-popup>

		<van-dialog
            v-model:show="closeUrlVisible"
            title="关闭链接"
            show-cancel-button
            @confirm="onConfirmCloseUrl"
        >
            <van-field
                label="链接"
				type="textarea"
                v-model="closeUrl"
                placeholder="请输入"
            />
        </van-dialog>
	</div>
	
</template>

<style scoped lang="scss">
.wrapper {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	padding: 10px;
	.url-box {
		margin-top: 20px;
		display: flex;
		align-items: center;
		gap: 10px;
		.url {
			word-break: break-all;
			flex: 1;
		}
	}
	.btn_box {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	::v-deep .van-popup {
		background: #fff !important;
	}
	.popup_content_wrap {
		width: 100vw;
		height: 100vh;
		background: #f1f1f1;
		box-sizing: border-box;
		position: relative;
		.list_box {
			height: calc(100% - 65px - env(safe-area-inset-bottom));
			overflow-y: auto;
			box-sizing: border-box;
			padding: 16px;
			.list_item {
				@include flexYCenter;
				position: relative;
				margin-bottom: 10px;
				background: #fff;
				min-height: 100px;
				border-radius: 5px;
				box-sizing: border-box;
				padding: 16px 0;
				&.disabled {
					opacity: 0.6;
				}
				.disabled-badge {
					position: absolute;
					top: 0;
					right: 0;
					background: rgba(0, 0, 0, 0.6);
					color: #fff;
					font-size: 12px;
					padding: 2px 6px;
					border-radius: 0 5px 0 5px;
					z-index: 1;
				}
				.left_area {
					@include flexCenterColumn;
					flex: 0 0 120px;
					color: #191919;
					.number {
						font-size: 28px;
						font-weight: bold;
					}
					.unit {
						font-size: 14px;
					}
					.cond {
						font-size: 12px;
					}
				}
				.right_area {
					flex: 1;
					@include flexYCenter(space-between);
					border-left: 1px dashed #ccc;
					padding: 0 18px;
					.name {
						font-size: 14px;
						.van-tag {
							margin-right: 5px;
							display: inline-block;
							vertical-align: text-bottom;
						}
					}
					.time {
						font-size: 12px;
						margin-top: 10px;
						.expire {
							color: #ee3f4d;
						}
					}
				}
			}
		}
		.bottom_btn {
			position: absolute;
			bottom: 0;
			width: 100%;
			border-top: 1px solid #eee;
			padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
			box-sizing: border-box;
			background: #fff;
			display: flex;
			gap: 10px;
			.van-button {
				flex: 1;
			}
		}
	}
}
</style>