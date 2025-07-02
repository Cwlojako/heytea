<script setup>
import { showToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { findCoupon } from '@/api/coupon'
import { generateLink, closeOrOpenLink, generateLinksBatch } from '@/api/link'

const router = useRouter()
const baseUrl = import.meta.env.VITE_BASE_URL
const isBatch = ref(0)
const batchCount = ref(5)
const price = ref('')
const uuid = ref('')
const phone = ref('')
const url = ref('')
const coupon = ref('')
const coupons = ref([])
const couponVisible = ref(false)
const list = ref([])
const closeUrlVisible = ref(false)
const closeUrl = ref('')
const urlDialog = ref(false)
const tabsActive = ref(0)

watch(couponVisible, (newVal) => {
	if (newVal) {
		tabsActive.value = 0
		onGetList(false)
	}
})

function onGetUuid() {
	return Array.from({ length: 16 }, () =>
		Math.floor(Math.random() * 16).toString(16)
	).join('')
}

async function onGenerateUrl() {
	if (isBatch.value) {
		let uuids = []
		let couponIds = []
		let urls = []
		for (let i = 0; i < batchCount.value; i++) {
			let uuid = onGetUuid()
			uuids.push(uuid)
			if (coupons.value.length) {
				couponIds.push(coupons.value[i])
				urls.push(`${window.location.origin}/store?u=${uuid}&c=${coupons.value[i]}`)
			} else {
				urls.push(`${window.location.origin}/store?u=${uuid}`)
			}
		}

		url.value = urls.join('\r\n')
		urlDialog.value = true
		let params = {
			uuids,
			price: price.value,
			phone: phone.value,
			urls,
			couponIds
		}
		coupons.value = []
		coupon.value = ''
		await generateLinksBatch(params)
	} else {
		let res = `${window.location.origin}/store?u=${uuid.value}`
		if (coupon.value) {
			res += `&c=${coupon.value}`
		}
		url.value = res
		urlDialog.value = true
		let params = {
			uuid: uuid.value,
			price: price.value,
			phone: phone.value,
			couponId: coupon.value || '',
			url: url.value
		}
		uuid.value = ''
		coupon.value = ''
		await generateLink(params)
	}
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

async function onGetList() {
	let params = {
		phone: phone.value,
		price: price.value
	}
	let { data: res } = await findCoupon(params)
	list.value = res.map(m => {
		return {
			...m,
			checked: isBatch.value ? coupons.value.includes(m.id) : m.id == coupon.value
		}
	})
}

function onCancel() {
	couponVisible.value = false
	list.value = []
}

function onConfirm() {
	couponVisible.value = false
	if (isBatch.value) {
		coupon.value = coupons.value.join(',')
	} else {
		coupon.value = list.value.find(f => f.checked).id
	}
	list.value = []
}

function onChecked(item) {
	if (isBatch.value) {
		if (item.checked) {
			coupons.value.push(item.id)
		} else {
			let idx = coupons.value.findIndex(f => f === item.id)
			coupons.value.splice(idx, 1)
		}
	} else {
		if (item.checked) {
			list.value.filter(i => i.id !== item.id).forEach(i => i.checked = false)
		}
	}

}

function toAccountSetting() {
	router.push({ name: 'AccountSetting' })
}

async function onConfirmCloseUrl() {
	const urls = closeUrl.value.split(';')
	const uuids = urls.map(e => {
		const queryParams = new URLSearchParams(new URL(e).search)
		const uuid = queryParams.get('u')
		return uuid
	})
	await closeOrOpenLink({ uuids })
	showToast('链接已关闭')
	closeUrl.value = ''
	closeUrlVisible.value = false
}

function toBackstage() {
	const routeData = router.resolve({ name: 'Backstage' })
	window.open(routeData.href, '_blank')
}

function onClearCoupon() {
	if (isBatch.value) {
		coupons.value = []
	}
	coupon.value = ''
}

const isReady = computed(() => {
	return price.value && (uuid.value || isBatch.value) && phone.value && phone.value.length === 11
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

const tabList = computed(() => {
	return (idx, list) => {
		return list.filter(item => idx === 0 ? !item.disabled : item.disabled)
	}
})

const couponBtnDisabled = computed(() => {
	return isBatch.value && coupons.value.length !== batchCount.value
})
</script>

<template>
	<div class="wrapper">
		<van-field name="radio" label="是否批量生成">
			<template #input>
				<van-radio-group v-model="isBatch" direction="horizontal">
					<van-radio :name="0">否</van-radio>
					<van-radio :name="1">是</van-radio>
				</van-radio-group>
			</template>
		</van-field>
		<van-field name="stepper" label="条数" v-if="!!isBatch">
			<template #input>
				<van-stepper v-model="batchCount" input-width="40px" button-size="32px" />
			</template>
		</van-field>
		<van-field label='UUID' v-model="uuid" readonly v-if="!!!isBatch">
			<template #button>
				<van-button size="small" type="primary" @click="uuid = onGetUuid()">获取UUID</van-button>
			</template>
		</van-field>
		<van-field label="价格" v-model="price" type="number" placeholder="请输入喜茶原价" />
		<van-field label="账号" v-model="phone" type="number" placeholder="请输入手机号账号" />
		<van-field label='优惠券' v-model="coupon" readonly placeholder="优先输入价格" :disabled="!couponReady">
			<template #button>
				<div class="btn_box">
					<van-icon class="clear_icon" v-if="coupon" name="clear" size="18" @click="onClearCoupon" />
					<van-button size="small" type="primary" @click="couponVisible = true"
						:disabled="!couponReady">选择优惠券</van-button>
				</div>
			</template>
		</van-field>

		<van-button type="primary" block style="margin-top: 10px;" :disabled="!isReady" @click="onGenerateUrl">生 成 链
			接</van-button>
		<div class="url-box" v-if="url">
			<p class="url">{{ url }}</p>
			<van-button size="small" type="success" @click="onCopyUrl(url)">复制链接</van-button>
		</div>
		<van-button type="warning" block style="margin-top: 10px;" @click="toAccountSetting">账 号 管 理</van-button>
		<van-button type="danger" block style="margin-top: 10px;" @click="closeUrlVisible = true">关 闭 链 接</van-button>
		<van-popup v-model:show="couponVisible" position="bottom">
			<div class="popup_content_wrap">
				<van-tabs color="#000" v-model:active="tabsActive">
					<van-tab :title="idx === 0 ? '可 用' : '不 可 用'" v-for="(item, idx) in 2" :key="idx">
						<div class="empty_box" v-if="!tabList(idx, list).length">
							<van-empty image="search" :description="idx === 0 ? '暂无可用优惠券' : '暂无不可用优惠券'" />
						</div>
						<div class="list_box" v-else>
							<div v-for="item in tabList(idx, list)" :key="item.id"
								:class="['list_item', { disabled: item.disabled }]">
								<div v-if="item.disabled" class="disabled-badge">
									不可用
									<span v-if="item.disabledText">{{ `,${item.disabledText}` }}</span>
								</div>
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
											<van-tag plain type="primary" v-if="item.bizLabels.length">{{
												LabelText(item.bizLabels[0]) }}</van-tag>
											<span>{{ item.name }}</span>
										</div>
										<div class="time">
											<span>{{ item.period_start }} ~ {{ item.period_end }}</span>
											<p class="expire" v-if="item.soon_expire">{{ item.periodText }}</p>
										</div>
									</section>
									<section>
										<van-checkbox v-model="item.checked" @change="(val) => onChecked(item)"
											checked-color="#131313" :disabled="!!item.disabled"></van-checkbox>
									</section>
								</div>
							</div>
						</div>
					</van-tab>
				</van-tabs>
				<div class="bottom_btn">
					<div class="selected_text" v-if="isBatch">
						{{ coupons.length }} / {{ batchCount }}
					</div>
					<van-button @click="onCancel">取 消</van-button>
					<van-button color="#131313" @click="onConfirm" :disabled="couponBtnDisabled">确 认</van-button>
				</div>
			</div>
		</van-popup>

		<van-popup v-model:show="closeUrlVisible" position="bottom" :style="{ height: '60vh' }" @close="closeUrl = ''"
			safe-area-inset-bottom>
			<div class="popup_content">
				<van-field label="链接：" type="textarea" autosize v-model="closeUrl" :spellcheck="false"
					placeholder="请输入，如若需要同时关闭多个链接，请用英文分号;分隔，如：链接1;链接2" />
				<div class="btn">
					<van-button type="warning" block :disabled="!closeUrl" @click="onConfirmCloseUrl">确 认 关
						闭</van-button>
				</div>
			</div>

		</van-popup>

		<van-dialog v-model:show="urlDialog" title="链接" confirm-button-text="复制链接" @confirm="onCopyUrl(url)">
			{{ url }}
		</van-dialog>

		<div class="entry_box" @click="toBackstage">
			<van-icon name="cashier-o" size="20" />
		</div>
	</div>

</template>

<style scoped lang="scss">
.wrapper {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	padding: 10px;

	.btn_box {
		display: flex;
		align-items: center;
		gap: 10px;
	}

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

		.van-dialog__header {
			padding: 16px 0 0 0;
		}

		.van-dialog__content {
			word-break: break-all;
			padding: 16px;
		}

		.van-field__control {
			word-break: break-all;
		}

		.popup_content {
			height: 100%;
			position: relative;

			.btn {
				position: absolute;
				bottom: calc(16px + env(safe-area-inset-bottom));
				width: 100%;
				padding: 0 16px;
				box-sizing: border-box;
			}
		}

		.van-field {
			height: calc(100% - 44px - 10px - env(safe-area-inset-bottom));
			overflow: auto;
		}
	}

	.popup_content_wrap {
		width: 100vw;
		height: 100vh;
		background: #f1f1f1;
		box-sizing: border-box;
		position: relative;
		overflow: hidden;

		::v-deep .van-tabs {
			height: 100%;

			.van-tabs__content {
				height: calc(100% - 44px - 65px);
				overflow: auto;

				.list_box {
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

						&:last-child {
							margin-bottom: 0;
						}

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

			.selected_text {
				@include flexCenter;
				font-weight: bold;
			}
		}
	}

	.entry_box {
		position: fixed;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		bottom: 10vh;
		right: 5vw;
		font-weight: bold;
		box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.2);
		cursor: pointer;
	}
}
</style>