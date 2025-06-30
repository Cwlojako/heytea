<script setup>
import { useRoute, useRouter } from 'vue-router'
import { findGoods, goodsDetail, settle, getLinkDetails } from '@/api/apis'
import { showToast } from 'vant'
import { useClickAway } from '@vant/use'
import debounce from 'lodash/debounce'
import { decrypt } from '@/utils/crypto'

const route = useRoute()
const router = useRouter()
const limitPrice = ref(0)
const phone = ref('')
const uuid = route.query.u
const couponId = route.query.c
const baseUrl = import.meta.env.VITE_BASE_URL
const keyword = ref('')
const list = ref([])
const showSkeleton = ref(false)
const productDetail = ref({})
const specs = ref([])
const popupVisible = ref(false)
const count = ref(1)
const shopCarList = ref([])
const shopCarListVisible = ref(false)
const carBox = ref()
const carBox1 = ref()
const goodsItem = ref()
const btnLoading = ref(false)
const remarkVisible = ref(false)
const remark = ref('')

async function getGoods(keyword = '') {
	showSkeleton.value = true
	const { data: res } = await findGoods({ shopId: route.params.id, name: keyword })
	list.value = res.filter(f => !f.combo_meal)
	showSkeleton.value = false
	nextTick(() => {
		list.value.forEach((e, idx) => {
			e.offsetHeight = goodsItem.value[idx].offsetHeight
		})
	})

}

async function showSpec(item) {
	const { is_enable, static_product_url } = item
	if (!is_enable) {
		showToast({ message: '本店暂时售罄', type: 'fail' })
		return
	}
	popupVisible.value = true
	const { data: res } = await goodsDetail({ shopId: route.params.id, productId: item.id, url: static_product_url })
	productDetail.value = res
	specs.value = res.skus[0]?.material_groups ?? []
	if (specs.value.length) {
		specs.value.forEach(e => {
			e.materials.forEach(f => {
				f.checked = f.is_selected
				if (f.exclusive.length) {
					f.exclusive.forEach(e1 => {
						let targetGroup = specs.value.find(f1 => f1.id === e1.group_id)
						targetGroup?.materials.filter(f2 => e1.exclusive_ids.includes(f2.id)).forEach(f3 => {
							f3.isHidden = f.checked
						})
					})
				}
				if (f.group_exclusive.length) {
					e.isHidden = f.checked && f.group_exclusive.includes(e.id)
				}
			})
		})
	}
}

function onPlus() {
	count.value++
}

function onMinus() {
	if (count.value > 1) {
		count.value--
	}
}

function onItemPlus(item) {
	item.count++
}

function onItemMinus(item) {
	item.count--
	if (item.count < 1) {
		shopCarList.value.splice(shopCarList.value.findIndex(i => i.uuid === item.uuid), 1)
	}
}

function onCheckSpec(i, item) {
	const checked = !i.checked
	if (!checked && item.is_mandatory) return
	if (!i.is_enable) return showToast('该选项已售罄')
	if (item.materials.some(s => s.checked)) {
		item.materials.forEach(e => e.checked = false)
	}
	i.checked = checked

	// 处理关联逻辑
	if (i.exclusive.length) {
		i.exclusive.forEach(e => {
			let targetGroup = specs.value.find(f => f.id === e.group_id)
			targetGroup?.materials.filter(f => e.exclusive_ids.includes(f.id)).forEach(f => {
				f.isHidden = checked
			})
		})
	} else {
		if (item.materials.some(s => s.exclusive.length)) {
			const arr = item.materials.filter(s => s.exclusive.length)
			arr.forEach(e => {
				e.exclusive.forEach(e1 => {
					let targetGroup = specs.value.find(f => f.id === e1.group_id)
					targetGroup?.materials.forEach(e => e.isHidden = false)
				})
			})
		}
	}

	if (i.group_exclusive.length) {
		specs.value.forEach(e => {
			e.isHidden = i.checked && i.group_exclusive.includes(e.id)
		})
	} else {
		if (item.materials.some(s => s.group_exclusive.length)) {
			const arr = item.materials.filter(s => s.group_exclusive.length)
			arr.forEach(e => {
				e.group_exclusive.forEach(e1 => {
					let targetGroup = specs.value.find(f => f.id === e1)
					targetGroup.isHidden = false
				})
			})
		}
	}

	if (i.checked && +i.price) {
		productDetail.value.price = +productDetail.value.price + +i.price
	} else if (!i.checked && +i.price) {
		productDetail.value.price = +productDetail.value.price - +i.price
	}
}

function onAddShopCar() {
	const { id } = productDetail.value
	// 构建规格uuid
	let uuid = specs.value.reduce((curr, next) => {
		return curr + (`${next.materials.some(f => f.checked) ? '-' + next.materials.find(f => f.checked).id : ''}`)
	}, id)
	if (shopCarList.value.some(e => e.uuid === uuid)) {
		shopCarList.value.find(e => e.uuid === uuid).count += count.value
		popupVisible.value = false
		count.value = 1
		return
	}
	shopCarList.value.push({
		...productDetail.value,
		count: count.value,
		uuid
	})
	popupVisible.value = false
	count.value = 1
}

function onShowShopCarList() {
	shopCarListVisible.value = !shopCarListVisible.value
}

const onSettle = debounce(async function () {
	if (btnLoading.value) return
	remarkVisible.value = true
}, 500, { leading: true })

async function onRemarkConfirm() {
	btnLoading.value = true
	if (+allPrice.value > +limitPrice.value) {
		showToast({ message: `不满足限制金额`, type: 'fail' })
		btnLoading.value = false
		return
	}
	const products = shopCarList.value.map(item => {
		const { skus } = item
		const material_ids = skus[0].material_groups.reduce((curr, next) => {
			return curr.concat(next.materials.some(s => s.checked) ? [next.materials.find(s => s.checked).id] : [])
		}, [])
		const material_nos = skus[0].material_groups.reduce((curr, next) => {
			return curr.concat(next.materials.some(s => s.checked) ? [next.materials.find(s => s.checked).no] : [])
		}, [])
		return {
			quantity: item.count,
			sku_id: skus[0].id,
			attribute_ids: [],
			material_ids,
			bind: [],
			uuid: `s:|${skus[0].no}|${material_nos.join(',')}|||;-${item.id}`,
			join_time: +new Date(),
			user_infos: []
		}
	})
	try {
		const { data: res } = await settle(
			{
				shopId: route.params.id,
				price: allPrice.value,
				products,
				signal: uuid,
				couponId,
				phone: phone.value,
				remark: remark.value
			}
		)
		showToast(res.message)
		btnLoading.value = false
		if (res.code === 0) {
			shopCarListVisible.value && (shopCarListVisible.value = false)
			shopCarList.value = []
			router.push({ name: 'OrderDetail', params: { u: uuid }, query: { ph: route.query.ph } })
		}
	} catch (error) {
		btnLoading.value = false
	}

}

useClickAway([carBox, carBox1], () => {
	if (shopCarListVisible.value) {
		shopCarListVisible.value = false
	}
}, { eventName: 'touchstart' })

const debouncedSearch = debounce(() => getGoods(keyword.value), 300)

async function _getLinkDetails() {
	const { data: res } = await getLinkDetails(route.query.u)
	phone.value = decrypt(res.phone)
	limitPrice.value = decrypt(res.price)
}

const totalPrice = computed(() => {
	return (productDetail.value.price * count.value).toFixed(2)
})

const allPrice = computed(() => {
	return shopCarList.value.reduce((total, item) => {
		return total + (item.price * item.count)
	}, 0).toFixed(2)
})

const allCount = computed(() => {
	return shopCarList.value.reduce((total, item) => {
		return total + item.count
	}, 0)
})

const specsText = computed(() => {
	return (item) => {
		let str = item.skus[0].material_groups.reduce((curr, next) => {
			return curr + (next.materials.some(f => f.checked) ? ',' + next.materials.find(f => f.checked).name : '')
		}, '')
		return str.trim().slice(1)
	}
})

onMounted(() => {
	getGoods()
	_getLinkDetails()
})

</script>

<template>
	<div class="goods_wrapper">
		<section class="shop_name">{{ route.query.name }}</section>
		<section class="search_area">
			<van-icon name="arrow-left" color="#969799" size="22" @click="router.go(-1)" />
			<van-search v-model="keyword" placeholder="请输入商品关键字" background="#fff" @search="(val) => getGoods(val)"
				@update:model-value="debouncedSearch" @clear="(e) => getGoods('')" />
		</section>

		<van-skeleton v-if="showSkeleton">
			<template #template>
				<div class="skeleton_box">
					<div class="skeleton_item" v-for="item in 6">
						<van-skeleton-image :style="{ width: '100%' }" />
						<div class="label_area">
							<van-skeleton-paragraph row-width="20%" />
							<van-skeleton-paragraph row-width="20%" />
						</div>
						<div class="title_area">
							<van-skeleton-paragraph row-width="80%" />
						</div>
						<div class="desc_area">
							<van-skeleton-paragraph row-width="100%" />
							<van-skeleton-paragraph row-width="100%" />
							<van-skeleton-paragraph row-width="50%" />
						</div>
					</div>
				</div>
			</template>
		</van-skeleton>
		<div :class="['list_box', { showShopCar: shopCarList.length }]" v-else>
			<div v-for="(item, idx) in list" class="list_item" ref="goodsItem" :key="item.id"
				:style="{ gridRowEnd: `span ${Math.ceil(item.offsetHeight / 5) + 2}` }">
				<div class="image_area">
					<van-image width="100%" height="100" :src="item.images[0].url" fit="cover" />
					<div class="sold_out_mask" v-if="!item.is_enable">
						<span>本店暂时售罄</span>
					</div>
				</div>
				<div class="label_area" v-if="item.labels.length">
					<span class="label_item" v-for="label in item.labels"
						:style="{ color: label.label_color, border: `1px solid ${label.label_color}` }" :key="label.id">
						{{ label.name }}
					</span>
				</div>
				<div class="name_area">
					<span class="name">{{ item.name }}</span>
				</div>
				<div class="desc_area">
					<p class="desc">{{ item.description }}</p>
				</div>
				<div class="price_area" v-if="+item.price">
					<span class="price"><b style="font-size: 12px;">￥</b>{{ item.price }}</span>
					<span class="icon" @click="showSpec(item)">
						<van-icon name="add" size="24" />
					</span>
				</div>
			</div>
		</div>

		<section class="shop_car_area" v-if="shopCarList.length">
			<div class="left_price" @click="onShowShopCarList" ref="carBox">
				<van-icon name="bag-o" color="#191919" size="28" :badge="allCount" />
				<span class="price">￥{{ allPrice }}</span>
			</div>
			<div :class="['right_btn', { disabled: btnLoading }]" @click="onSettle">
				<van-loading v-if="btnLoading" size="20" style="margin-right: 5px;" />
				{{ btnLoading ? '下单中' : '结 算' }}
			</div>

			<div :class="['mask', { visible: shopCarListVisible }]">
				<div class="shop_car_list_box" :style="{
					height: shopCarListVisible ? `${shopCarList.length * 150}px` : 0,
					padding: shopCarListVisible ? '16px' : 0
				}" ref="carBox1">
					<div class="shop_car_list_item" v-for="item in shopCarList" :key="item.uuid">
						<van-image width="70px" height="70px" :src="item.images[0].url" fit="cover" />
						<div class="right_area">
							<p class="name">{{ item.name }}</p>
							<p class="specs">{{ specsText(item) }}</p>
							<div class="price_count">
								<span class="price">￥{{ item.price }}</span>
								<div class="count_box">
									<span class="minus" @click="onItemMinus(item)">-</span>
									<span class="count">{{ item.count }}</span>
									<span class="plus" @click="onItemPlus(item)">+</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- 规格弹窗 -->
		<van-popup v-model:show="popupVisible" position="bottom" closeable>
			<div class="popup_content_wrap">
				<section class="spec_area" v-if="specs.length">
					<div v-for="item in specs" :key="item.id" :class="['item_wrap', { isHidden: item.isHidden }]">
						<template v-if="!item.materials.every(e => e.isHidden)">
							<p class="title">
								<van-image v-if="item.icon" :src="item.icon" width="28px"></van-image>
								<span>{{ item.name }}</span>
							</p>
							<div class="spec_box">
								<div :class="['spec_item', { checked: i.checked, isHidden: i.isHidden, disabled: !i.is_enable }]"
									v-for="i in item.materials" @click="onCheckSpec(i, item)">
									<span>{{ i.name }}<b v-if="+i.price">￥{{ i.price }}</b></span>
								</div>
							</div>
						</template>
					</div>
				</section>
				<section class="count_area">
					<span class="minus" @click="onMinus">-</span>
					<span class="count">{{ count }}</span>
					<span class="plus" @click="onPlus">+</span>
				</section>
				<section class="btn_area" @click="onAddShopCar">
					<span class="price"><b style="font-size: 12px;">￥</b>{{ totalPrice }}</span>
					<span>加入购物袋</span>
				</section>
			</div>
		</van-popup>

		<van-dialog v-model:show="remarkVisible" title="备注信息" show-cancel-button confirmButtonText="继续下单"
			cancelButtonText="取消" @confirm="onRemarkConfirm">
			<van-field label="备注" v-model="remark" placeholder="无需备注请点击继续下单" />
		</van-dialog>
	</div>
</template>

<style scoped lang="scss">
.goods_wrapper {
	.shop_name {
		@include ellipsis;
		height: 50px;
		line-height: 50px;
		font-size: 20px;
		font-weight: bold;
		text-align: center;
		color: #333;
		width: 70%;
		margin: 0 auto;
	}

	::v-deep .van-dialog__header {
		background: #fff !important;
		padding: 16px 0;
	}

	height: 100vh;
	box-sizing: border-box;
	overflow-y: hidden;

	.search_area {
		@include flexYCenter;
		gap: 10px;
		padding: 0 16px 16px;

		.van-search {
			padding: 0;
			flex: 1;
			border: 1px solid #f1f1f1;
		}
	}

	.van-skeleton {
		width: 100%;
		padding: 0;
		box-sizing: border-box;

		.skeleton_box {
			width: 100%;
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			grid-gap: 10px;
			padding: 0 16px;

			.label_area {
				display: flex;
				gap: 5px;
				margin-top: 5px;

				.van-skeleton-paragraph {
					margin: 0;
				}
			}

			.title_area {
				margin-top: 5px;
			}

			.desc_area {
				margin-top: 5px;

				.van-skeleton-paragraph {
					margin: 0 0 5px 0;
				}
			}
		}
	}

	.list_box {
		height: calc(100% - 102px);
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-column-gap: 10px;
		grid-auto-rows: 5px;
		padding: 0 16px 16px;
		box-sizing: border-box;

		&.showShopCar {
			height: calc(100% - 50px - 102px - env(safe-area-inset-bottom));
		}

		.list_item {
			padding: 10px;
			border: 1px solid #eee;
			border-radius: 5px;
			height: fit-content;

			.image_area {
				position: relative;

				.sold_out_mask {
					position: absolute;
					bottom: 0;
					left: 0;
					font-size: 12px;
					color: #fff;
					width: 100%;
					background-color: rgba(0, 0, 0, .5);
					text-align: center;
					padding: 5px 0;
					letter-spacing: 2px;
				}
			}

			.label_area {
				margin-top: 5px;
				line-height: 24px;

				.label_item {
					padding: 2px 4px;
					border-radius: 2px;
					font-size: 12px;
					margin-bottom: 5px;
					margin-right: 5px;

					&:last-child {
						margin-right: 0;
					}
				}
			}

			.name_area {
				font-size: 16px;
				margin: 5px 0;
				color: #333;
			}

			.desc_area {
				@include ellipsis_n(2);
				font-size: 12px;
				color: #999;
			}

			.price_area {
				margin-top: 10px;
				color: #333;
				@include flexYCenter(space-between);

				.price {
					font-weight: bolder;
					font-size: 16px;
				}
			}
		}
	}

	.shop_car_area {
		@include flexYCenter(space-between);
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(50px + env(safe-area-inset-bottom));
		background-color: #fff;
		border-top: 1px solid #eee;
		padding: 0 0 0 16px;
		padding-bottom: env(safe-area-inset-bottom);
		box-sizing: border-box;

		.left_price {
			@include flexYCenter;
			font-weight: bolder;
			flex: 1;
			height: 100%;

			.price {
				margin-left: 8px;
				font-size: 18px;
			}
		}

		.right_btn {
			@include flexCenter;
			background-color: #191919;
			color: #fff;
			font-size: 14px;
			padding: 0 16px;
			height: 100%;
			line-height: 50px;
			width: 80px;

			&.disabled {
				background-color: #eee;
				color: #999;
				cursor: not-allowed;
			}
		}

		.mask {
			position: absolute;
			bottom: calc(50px + env(safe-area-inset-bottom));
			left: 0;
			height: 0;
			width: 100%;
			height: 0;
			background-color: rgba(0, 0, 0, .5);
			z-index: 10;
			transition: height .2s ease-in-out;

			&.visible {
				height: 100vh;
			}

			.shop_car_list_box {
				position: absolute;
				bottom: 0;
				left: 0;
				height: 0;
				width: 100%;
				transition: height .2s ease;
				background-color: #fff;
				overflow: hidden;
				box-sizing: border-box;
				border-top: 1px solid #eee;
				border-radius: 20px 20px 0 0;
				z-index: 11;
				display: flex;
				flex-direction: column;
				justify-content: space-around;
				max-height: 80vh;
				overflow-y: auto;
				gap: 16px;

				.shop_car_list_item {
					display: flex;
					gap: 16px;

					.right_area {
						flex: 1;
						color: #191919;

						.specs {
							font-size: 12px;
							color: #999;
							margin-top: 5px;
							background-color: #f4f4f2;
							padding: 5px 10px;
							line-height: 1.5;
							border-radius: 5px;
							box-sizing: border-box;
						}

						.price_count {
							@include flexYCenter(space-between);
							margin-top: 10px;

							.price {
								font-weight: bolder;
							}

							.count_box {
								@include flexYCenter;

								.plus {
									@include flexCenter;
									font-size: 28px;
									color: #fff;
									background-color: #191919;
									border-radius: 50%;
									width: 25px;
									height: 25px;
									box-sizing: border-box;
								}

								.minus {
									@include flexCenter;
									font-size: 28px;
									color: #000;
									border-radius: 50%;
									border: 1px solid #191919;
									width: 25px;
									height: 25px;
									box-sizing: border-box;
								}

								.count {
									margin: 0 10px;
								}
							}
						}
					}
				}
			}
		}

	}

	.popup_content_wrap {
		padding: 16px;
		background-color: #fff;
		height: 85vh;
		box-sizing: border-box;

		.spec_area {
			overflow-y: auto;
			height: calc(100% - 75px - 20px - env(safe-area-inset-bottom));

			.item_wrap {
				.title {
					@include flexYCenter(flex-start);
					color: #999;
					font-size: 13px;

					.van-image {
						margin-right: 5px;
					}
				}

				.spec_box {
					display: flex;
					flex-wrap: wrap;
					gap: 10px;
					margin: 10px 0;

					.spec_item {
						height: 35px;
						line-height: 35px;
						text-align: center;
						font-size: 13px;
						padding: 0 16px;
						background-color: #ededeb;
						color: #333;
						border-radius: 2px;

						&.checked {
							background-color: #191919;
							color: #fff;
						}

						&.isHidden {
							display: none;
						}

						&.disabled {
							color: #c3c3c2;
							cursor: not-allowed;
						}
					}
				}

				&.isHidden {
					display: none;
				}
			}
		}

		.count_area {
			@include flexYCenter(flex-end);
			margin-top: 10px;

			.plus {
				@include flexCenter;
				font-size: 28px;
				color: #fff;
				background-color: #191919;
				border-radius: 50%;
				width: 25px;
				height: 25px;
				box-sizing: border-box;
			}

			.minus {
				@include flexCenter;
				font-size: 28px;
				color: #000;
				border-radius: 50%;
				border: 1px solid #191919;
				width: 25px;
				height: 25px;
				box-sizing: border-box;
			}

			.count {
				margin: 0 10px;
			}
		}

		.btn_area {
			@include flexCenter;
			width: 100%;
			background-color: #191919;
			color: #fff;
			height: 50px;
			line-height: 50px;
			margin-top: 10px;
			border-radius: 5px;
			font-weight: bolder;

			.price {
				margin-right: 5px;
				font-size: 14px;
			}
		}
	}
}
</style>