<script setup>
	import { useRoute } from 'vue-router'
	import axios from 'axios'
	import { showToast } from 'vant'
import { isHidden } from 'vant/lib/utils'

	const route = useRoute()
	const baseUrl = import.meta.env.VITE_BASE_URL
	const keyword = ref('')
	const list = ref([])
	const showSkeleton = ref(false)
	const productDetail = ref({})
	const specs = ref([])
	const popupVisible = ref(false)
	const count = ref(1)

	async function getGoods(keyword = '') {
		showSkeleton.value = true
		const { data: res } = await axios.post(`${baseUrl}/findGoods`, { shopId: route.params.id, name: keyword })
		list.value = res.data
		showSkeleton.value = false
	}

	async function showSpec(item) {
		const { is_enable, static_product_url } = item
		if (!is_enable) {
			showToast({ message: '本店暂时售罄', type: 'fail' })
			return
		}
		popupVisible.value = true
		const { data: res } = await axios.get(`https://static-cos-menu.heytea.com${static_product_url}`)
		productDetail.value = res
		specs.value = res.skus[0]?.material_groups ?? []
	}

	function onPlus() {
		count.value++
	}

	function onMinus() {
		if (count.value > 1) {
			count.value--
		}
	}

	function onCheckSpec(i, item) {
		const checked = !i.checked
		if (item.materials.some(s => s.checked)) {
			item.materials.forEach(e => e.checked = false)
		}
		i.checked = checked

		// 处理关联逻辑
		console.log(item)
		if (i.exclusive.length) {
			i.exclusive.forEach(e => {
				let targetGroup = specs.value.find(f => f.id === e.group_id)
				targetGroup.materials.filter(f => e.exclusive_ids.includes(f.id)).forEach(f => {
					f.isHidden = checked
				})
			})
		}
	}

	const totalPrice = computed(() => {
		return (productDetail.value.price * count.value).toFixed(2)
	})

	onMounted(() => {
		getGoods()
	})

</script>

<template>
	<div class="goods_wrapper">
		<van-search
			v-model="keyword"
			placeholder="请输入商品关键字"
			shape="round"
			background="#fff"
			@search="(val) => getGoods(val)"
			@clear="(e) => getGoods('')"
		/>
		<van-skeleton v-if="showSkeleton">
			<template #template>
				<div class="skeleton_box">
					<div class="skeleton_item" v-for="item in 6">
						<van-skeleton-image :style="{ width: '100%' }"/>
						<div class="label_area">
							<van-skeleton-paragraph row-width="20%"/>
							<van-skeleton-paragraph row-width="20%"/>
						</div>
						<div class="title_area">
							<van-skeleton-paragraph row-width="80%"/>
						</div>
						<div class="desc_area">
							<van-skeleton-paragraph row-width="100%"/>
							<van-skeleton-paragraph row-width="100%"/>
							<van-skeleton-paragraph row-width="50%"/>
						</div>
					</div>
				</div>
			</template>
		</van-skeleton>
		<div class="list_box" v-else>
			<div class="list_item" v-for="item in list" :key="item.id">
				<div class="image_area">
					<van-image width="100%" height="100" :src="item.images[0].url" fit="cover"/>
					<div class="sold_out_mask" v-if="!item.is_enable">
						<span>本店暂时售罄</span>
					</div>
				</div>
				<div class="label_area" v-if="item.labels.length">
					<span class="label_item" v-for="label in item.labels" :style="{ color: label.label_color, border: `1px solid ${label.label_color}` }" :key="label.id">
						{{ label.name }}
					</span>
				</div>
				<div class="name_area">
					<span class="name">{{ item.name }}</span>
				</div>
				<div class="desc_area">
					<p class="desc">{{ item.description }}</p>
				</div>
				<div class="price_area">
					<span class="price"><b style="font-size: 12px;">￥</b>{{ item.price }}</span>
					<span class="icon" @click="showSpec(item)">
						<van-icon name="add" size="24"/>
					</span>
				</div>
			</div>
		</div>

		<van-popup
			v-model:show="popupVisible"
			position="bottom"
			:style="{ height: 'fit-content' }"
		>
			<div class="popup_content_wrap">
				<section class="spec_area">
					<div class="item_wrap" v-for="item in specs" :key="item.id">
						<p class="title">
							<van-image v-if="item.icon" :src="item.icon" width="28px"></van-image>
							<span>{{ item.name }}</span>
						</p>
						<div class="spec_box">
							<div
								:class="['spec_item', { checked: i.checked, isHidden: i.isHidden }]"
								v-for="i in item.materials"
								@click="onCheckSpec(i, item)"
							>
								<span>{{ i.name }}<b v-if="+i.price">￥{{ i.price }}</b></span>
							</div>
						</div>
					</div>
				</section>
				<section class="count_area">
					<span class="minus" @click="onMinus">-</span>
					<span class="count">{{ count }}</span>
					<span class="plus" @click="onPlus">+</span>
				</section>
				<section class="btn_area">
					<span class="price"><b style="font-size: 12px;">￥</b>{{ totalPrice }}</span>
					<span>加入购物车</span>
				</section>
			</div>
		</van-popup>
	</div>
</template>

<style scoped lang="scss">
.goods_wrapper {
	padding: 16px;
	height: 100vh;
	box-sizing: border-box;
	overflow-y: hidden;
	.van-search {
		padding: 0;
		margin-bottom: 10px;
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
		height: calc(100% - 44px);
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-gap: 10px;
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
					background-color: rgba(0,0,0,.5);
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
				@include ellipsis_n(3);
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
	.popup_content_wrap {
		padding: 16px;
		background-color: #fff;
		.spec_area {
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
					}
				}
			}
		}
		.count_area {
			@include flexYCenter(flex-end);
			margin-top: 16px;
			.minus,.plus {
				@include flexCenter;
				font-size: 28px;
				color: #fff;
				background-color: #191919;
				border-radius: 50%;
				width: 25px;
				height: 25px;
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
			margin-top: 16px;
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