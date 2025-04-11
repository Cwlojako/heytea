<script setup>
	import { encrypt } from '@/utils/crypto'
	import { showToast } from 'vant'
	import axios from 'axios'

	const baseUrl = import.meta.env.VITE_BASE_URL
	const price = ref('')
	const numberVisible = ref(false)
	const uuid = ref('')
	const url = ref('')
	const dialogVisible = ref(false)
	const token = ref('')
	const coupon = ref('')
	const couponVisible = ref(false)
	const list = ref([])
	const loading = ref(false)
	const finished = ref(true)
	const pageData = ref({
		page: 1,
		size: 10
	})

	watch(couponVisible, (newVal) => {
		if (newVal) {
			onGetList(false)
		}
	})

	function onInput(value) {
		price.value += value
	}

	function onDelete() {
		price.value = price.value.slice(0, -1)
	}

	function onGetUuid() {
		uuid.value = Array.from({ length: 16 }, () =>
			Math.floor(Math.random() * 16).toString(16)
		).join('')
	}

	function onGenerateUrl() {
		const p = encodeURIComponent(encrypt(price.value))
		const res = `${window.location.origin}/store?u=${uuid.value}&p=${p}&c=${coupon.value}`
		url.value = res
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

	function onSetToken() {
		dialogVisible.value = true
	}

	async function onConfirmSetToken() {
		await axios.get(`${baseUrl}/setToken?token=${token.value}`)
		showToast('设置成功')
		dialogVisible.value = false
		token.value = ''
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
		let { data: res } = await axios.post(`${baseUrl}/findCoupon`, pageData.value)
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

	const isReady = computed(() => {
		return price.value && uuid.value
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
		<van-field label='价格' v-model="price" readonly clickable @touchstart.stop="numberVisible = true"/>
		<van-field label='UUID' v-model="uuid" readonly>
			<template #button>
				<van-button size="small" type="primary" @click="onGetUuid">获取UUID</van-button>
			</template>
		</van-field>
		<van-field
			label='优惠券'
			v-model="coupon"
			readonly
			placeholder="优先输入价格"
			:disabled="!price"
		>
		<template #button>
				<van-button size="small" type="primary" @click="couponVisible = true" :disabled="!price">选择优惠券</van-button>
			</template>
		</van-field>

		<van-button type="primary" block style="margin-top: 10px;" :disabled="!isReady" @click="onGenerateUrl">生 成 链 接</van-button>
		<div class="url-box" v-if="url">
			<p class="url">{{ url }}</p>
			<van-button size="small" type="success" @click="onCopyUrl(url)">复制链接</van-button>
		</div>
		
		<van-button type="warning" block style="margin-top: 10px;" @click="onSetToken">设 置 Token</van-button>
		<van-dialog
			v-model:show="dialogVisible"
			title="设置Token"
			show-cancel-button
			@confirm="onConfirmSetToken"
		>
			<van-field
				v-model="token"
				rows="1"
				autosize
				label="Token"
				type="textarea"
				placeholder="请输入"
			/>
		</van-dialog>

		<van-number-keyboard
			:show="numberVisible"
			theme="custom"
			:extra-key="['00', '.']"
			close-button-text="完成"
			@blur="numberVisible = false"
			@input="onInput"
			@delete="onDelete"
		/>

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