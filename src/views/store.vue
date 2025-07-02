<script setup>
import { findStore } from '@/api/client'
import { getLinkDetails } from '@/api/link'
import { showToast } from 'vant'
import { useStoreState } from '@/stores'
import { useRouter, useRoute } from 'vue-router'
import { debounce } from 'lodash'
import { decrypt } from '@/utils/crypto'

const router = useRouter()
const route = useRoute()

const baseUrl = import.meta.env.VITE_BASE_URL
const keyword = ref('')
const list = ref([])
const loading = ref(false)
const finished = ref(true)
const showMaskLoading = ref(false)
const search = ref()
const phone = ref('')

const storeState = useStoreState()

async function onSearch(isNext = false) {
	loading.value = true
	finished.value = false
	let loadShopIds = []
	if (isNext) {
		loadShopIds = list.value.map(m => m.id)
	}
	!isNext && (showMaskLoading.value = true)
	let params = isNext ? { name: keyword.value, loadShopIds, phone: phone.value } : { name: keyword.value, phone: phone.value }
	try {
		let { data: res } = await findStore(params)
		const { list: _list, isLast } = res
		let result = isNext ? list.value.concat(_list) : _list
		list.value = result
		finished.value = isLast
		loading.value = false
		!isNext && (showMaskLoading.value = false)
	} catch (err) {
		loading.value = false
		finished.value = true
		!isNext && (showMaskLoading.value = false)
	}
}

function loadMore() {
	!finished.value && onSearch(true)
}

function toGoods(item) {
	storeState.setSavedState({
		keyword: keyword.value,
		list: list.value,
		finished: finished.value
	})
	const { u, c } = route.query
	const { id, name } = item
	router.push({ name: 'Goods', params: { id }, query: { u, c, name } })
}

function onClear() {
	onSearch(false)
	search.value.blur()
}

const debouncedSearch = debounce(() => onSearch(false), 300)

async function _getLinkDetails() {
	const { data: res } = await getLinkDetails(route.query.u)
	phone.value = decrypt(res.phone)
}

onMounted(() => {
	_getLinkDetails()
})

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
		<div class="step_box">
			<p class="title">温馨提示：下单步骤</p>
			<van-steps :active="3" active-color="#000000">
				<van-step>搜索门店</van-step>
				<van-step>挑选商品</van-step>
				<van-step>结算下单</van-step>
				<van-step>查取茶号</van-step>
			</van-steps>
		</div>
		<van-search ref="search" v-model="keyword" placeholder="请输入门店关键字，门店名称必须跟小程序一致" background="#fff"
			@search="(val) => onSearch(false)" @update:model-value="debouncedSearch" @clear="onClear" />
		<section class="list_box">
			<div class="loading_box" v-if="showMaskLoading">
				<van-loading type="spinner" />
			</div>
			<van-list v-if="list.length" v-model:loading="loading" :finished="finished" finished-text="没有更多了"
				@load="loadMore">
				<div v-for="item in list" :key="item" :class="['list-item', { disabled: !item.is_actived }]"
					@click="toGoods(item)">
					<span class="top_name">
						{{ item.name }}
						<van-tag type="warning" v-if="!item.is_actived">门店休息中</van-tag>
					</span>
					<span class="bottom_address">{{ item.address }}</span>
				</div>
			</van-list>
			<van-image v-else width="150" height="150"
				src="https://static.heytea.com/taro_trial/v1/img/my/me_img_head_login.png" round />
		</section>
	</div>
</template>

<style scoped lang="scss">
.store_wrapper {
	padding: calc(20px + env(safe-area-inset-top)) 16px 20px 16px;
	height: 100vh;
	box-sizing: border-box;
	overflow-y: hidden;

	.step_box {
		width: 100%;
		box-sizing: border-box;
		overflow: hidden;

		.van-steps {
			width: 100%;
			box-sizing: border-box;
			font-size: 14px;

			::v-deep .van-step__title {
				font-size: 14px;
			}
		}

		.title {
			margin-bottom: 20px;
			text-align: center;
			font-size: 16px;
			font-weight: bolder;
		}
	}

	.van-search {
		padding: 0;
		border: 1px solid #f1f1f1;
	}

	.list_box {
		height: calc(100% - 36px - 102px);
		overflow-y: auto;
		position: relative;

		.loading_box {
			position: absolute;
			top: 0;
			left: 0;
			bottom: 0;
			right: 0;
			@include flexCenter;
			background-color: rgba(0, 0, 0, .5);
			z-index: 99;
		}

		.van-image {
			margin: 50px auto 0;
			display: block;
		}
	}

	.list-item {
		@include flexCenterColumn(flex-start);
		padding: 16px;
		border-bottom: 1px solid #eee;
		gap: 5px;

		&.disabled {
			background-color: #f7f7f7;
		}

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