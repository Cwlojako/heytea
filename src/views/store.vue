<script setup>
import axios from 'axios'
import { showToast } from 'vant'
import { useStoreState } from '@/stores'
import { useRouter } from 'vue-router'
const router = useRouter()

const baseUrl = import.meta.env.VITE_BASE_URL
const keyword = ref('')
const list = ref([])
const loading = ref(false)
const finished = ref(true)
const showMaskLoading = ref(false)
const search = ref()

const storeState = useStoreState()

async function onSearch(isNext = false) {
	loading.value = true
	finished.value = false
	let loadShopIds = []
	if (isNext) {
		loadShopIds = list.value.map(m => m.id)
	}
	!isNext && (showMaskLoading.value = true)
	let params = isNext ? { name: keyword.value, loadShopIds } : { name: keyword.value }
	let { data: res } = await axios.post(`${baseUrl}/findStore`, params)
	if (res.code === 0) {
		const { list: _list, isLast } = res.data
		let result = isNext ? list.value.concat(_list) : _list
		list.value = result
		finished.value = isLast
		loading.value = false
		!isNext && (showMaskLoading.value = false)
	} else {
		showToast({ message: res.message, type: 'fail' })
		loading.value = false
		finished.value = true
		!isNext && (showMaskLoading.value = false)
	}
}

function loadMore() {
	!finished.value && onSearch(true)
}

function toGoods(id) {
	storeState.setSavedState({
		keyword: keyword.value,
		list: list.value,
		finished: finished.value
	})
	router.push({ name: 'Goods', params: { id } })
}

function onClear() {
	onSearch(false)
	search.value.blur()
}

onActivated(() => {
	const { keyword: savedKeyword, list: savedList, finished: savedFinished } = storeState.savedState
  keyword.value = savedKeyword
  list.value = savedList
  finished.value = savedFinished
})

onDeactivated(() => {
	loading.value = false
})

</script>

<template>
	<div class="store_wrapper">
		<van-search
			ref="search"
			v-model="keyword"
			placeholder="请输入门店或地址关键字"
			shape="round"
			background="#fff"
			@search="(val) => onSearch(false)"
			@clear="onClear"
		/>
		<section class="list_box">
			<div class="loading_box" v-if="showMaskLoading">
				<van-loading type="spinner"/>
			</div>
			<van-list
				v-if="list.length"
				v-model:loading="loading"
				:finished="finished"
				finished-text="没有更多了"
				@load="loadMore"
			>
				<div v-for="item in list" :key="item" class="list-item" @click="toGoods(item.id)">
					<span class="top_name">{{ item.name }}</span>
					<span class="bottom_address">{{ item.address }}</span>
				</div>
			</van-list>
			<div class="step_box" v-else>
				<van-image
					width="180"
					height="180"
					src="https://static.heytea.com/taro_trial/v1/img/my/me_img_head_login.png"
					round
				/>
				<p class="title">温馨提示：下单步骤</p>
				<van-steps :active="3" active-color="#000000">
					<van-step>搜索门店</van-step>
					<van-step>挑选商品</van-step>
					<van-step>点击下单</van-step>
					<van-step>看取茶号</van-step>
				</van-steps>
			</div>
		</section>
	</div>
</template>

<style scoped lang="scss">
.store_wrapper {
	padding: 16px;
	height: 100vh;
	box-sizing: border-box;
	overflow-y: hidden;
	.van-search {
		padding: 0;
		margin-bottom: 10px;
	}
	.list_box {
		height: calc(100% - 44px);
		overflow-y: auto;
		position: relative;
		.loading_box {
			position: absolute;
			top: 0;
			left: 0;
			bottom: 0;
			right: 0;
			@include flexCenter;
			background-color: rgba(0,0,0,.92);
			z-index: 99;
		}
		.step_box {
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			overflow: hidden;
			.van-steps {
				width: 100%;
				box-sizing: border-box;
				font-size: 14px;
				::v-deep .van-step__title{
					font-size: 14px;
				}
			}
			.van-image {
				margin: 20px auto 0;
				display: block;
			}
			.title {
				margin: 20px 0;
				text-align: center;
				font-size: 16px;
				font-weight: bolder;
			}
		}
	}
	.list-item {
		@include flexCenterColumn(flex-start);
		padding: 16px;
		border-bottom: 1px solid #eee;
		gap: 5px;
		.top_name {
			font-size: 16px;
			color: #333;
		}
		.bottom_address {
			font-size: 14px;
			color: #999;
		}
	}
}
</style>