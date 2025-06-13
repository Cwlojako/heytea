<script lang="ts" setup>
import { getOrders, orderDetail } from '@/api/apis'
import { showToast } from 'vant'
import { CopyDocument, StarFilled } from '@element-plus/icons-vue'
import { ElMessageBox, TableColumnCtx } from 'element-plus'
import { h } from 'vue'
import type { VNode } from 'vue'

interface SummaryMethodProps<T> {
  columns: TableColumnCtx<T>[]
  data: T[]
}

const baseUrl = import.meta.env.VITE_BASE_URL
const pageData = reactive({
	page: 1,
	size: 50,
	total: 0
})
const queryParams = reactive({
	phone: ''
})
let orderInfo = reactive({
	shop: {},
	items: {}
})
const drawerVisible = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const tableRef = ref()

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

async function getList() {
	tableRef.value.setScrollTop(0)
	let params = {
		...pageData,
		...queryParams
	}
	let { data: res } = await getOrders(params)
	const { list = [], total = 0 } = res
	tableData.value = list
	pageData.total = total
}

async function getOrderDetail(row) {
	const { signal, phone } = row
	try {
		const { data: res } = await orderDetail(signal, phone)
		orderInfo = Object.assign(orderInfo, res.orderInfo)
		drawerVisible.value = true
	} catch {}
	
}

function onSelectionChange(selected) {
	selectedRows.value = selected
}

const getSummaries = (param: SummaryMethodProps) => {
  const { columns, data } = param
  const sums: (string | VNode)[] = []
  columns.forEach((column, index) => {
		if (index === 0) {
      sums[index] = h('div', {}, [
        '合计',
      ])
      return
    }
		if (index === 2) {
			sums[index] = 'N/A'
			return
		}
    const values = data.map((item) => Number(item[column.property]))
    if (!values.every((value) => Number.isNaN(value))) {
      sums[index] = `￥${values.reduce((prev, curr) => {
        const value = Number(curr)
        if (!Number.isNaN(value)) {
          return prev + curr
        } else {
          return prev
        }
      }, 0).toFixed(2)}`
    } else {
      sums[index] = 'N/A'
    }
  })

  return sums
}

const specsText = computed(() => {
	return (item) => {
		return item.materials.data.map((m) => m.name).join('，')
	}
})

onMounted(() => {
	getList()
})

</script>

<template>
    <div class="content_wrapper">
			<div class="search_box">
				<el-form inline :model="queryParams" @submit.native.prevent>
					<el-form-item label="手机账号">
						<el-input
							v-model="queryParams.phone"
							placeholder="手机账号，支持模糊查询"
							clearable
							style="width: 200px;"
							@change="getList"
						/>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" @click="getList">搜 索</el-button>
					</el-form-item>
				</el-form>
			</div>
			<el-table
				:data="tableData"
				ref="tableRef"
				style="width: 100%"
				stripe
				border
				show-summary
				:summary-method="getSummaries"
				sum-text="合计"
				height="calc(100% - 52px - 50px)"
				@selection-change="onSelectionChange"
			>
				<el-table-column type="selection" width="60" />
				<el-table-column prop="order_no" label="订单号">
					<template #default="scope">
						<span style="color: #1890ff; cursor: pointer;" @click="getOrderDetail(scope.row)">{{ scope.row.order_no }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="phone" label="手机账号" />
				<el-table-column prop="price" label="成交价格">
					<template #default="scope">
						<span style="color: #1890ff;">￥{{ scope.row.price }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="originPrice" label="原始价格">
					<template #default="scope">
						<span style="color: #1890ff;">￥{{ scope.row.originPrice }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="createdAt" label="下单时间" />
			</el-table>
			<div class="page_box">
				<el-pagination
					v-model:current-page="pageData.page"
					v-model:page-size="pageData.size"
					:page-sizes="[20, 50, 100, 200, 500]"
					background
					layout="sizes, prev, pager, next, total"
					:total="pageData.total"
					@size-change="getList"
					@current-change="getList"
				/>
			</div>

			<el-drawer v-model="drawerVisible" :with-header="false">
				<el-form :model="orderInfo" label-width="auto">
					<el-form-item label="取茶号：">
						<el-input v-model="orderInfo.pickup_no" readonly/>
					</el-form-item>
					<el-form-item label="下单时间：">
						<el-input v-model="orderInfo.paid_at" readonly/>
					</el-form-item>
					<el-form-item label="备注信息：">
						<el-input type="textarea" v-model="orderInfo.remarks" disabled/>
					</el-form-item>
					<el-divider>
						<el-icon><StarFilled /></el-icon>
					</el-divider>
					<el-form-item label="门店名称：">
						<el-input v-model="orderInfo.shop.name" readonly/>
					</el-form-item>
					<el-divider>
						<el-icon><StarFilled /></el-icon>
					</el-divider>
				</el-form>
				<div class="product_area">
					<div class="product_item" v-for="item in orderInfo.items.data" :key="item.id">
						<el-image :src="item.images.data[0].url" fit="cover"/>
						<div class="product_info">
								<div class="top">
										<span class="name">{{ item.name }}</span>
										<span class="price">￥{{ item.price }}</span>
								</div>
								<div class="bottom">
										<span class="spec">{{ specsText(item) }}</span>
										<span class="quantity">x{{ item.quantity }}</span>
								</div>
						</div>
					</div>
				</div>
				<el-divider>
					<el-icon><StarFilled /></el-icon>
				</el-divider>
				<el-form-item label="总价：">
						<el-input type="number" v-model="orderInfo.total_fee" readonly>
							<template #prepend>￥</template>
						</el-input>
					</el-form-item>
			</el-drawer>
    </div>
</template>

<style scoped lang="scss">
	.content_wrapper {
		height: 100%;
		.search_box {
			height: 50px;
			.el-form {
				height: 100%;
				display: flex;
				.el-form-item {
					margin: 0 10px 0 0;
					display: inline-flex;
					align-items: center;
				}
			}
		}
		.page_box {
			margin-top: 20px;
			display: flex;
			flex-direction: row-reverse;
		}
		.product_area {
				position: relative;
				.product_item {
					display: flex;
					gap: 10px;
					padding: 20px 0;
					.el-image {
						flex: 0 0 60px;
						height: 60px;
					}
					.product_info {
						flex: 1;
						@include flexCenterColumn(flex-start);
						.top {
							@include flexYCenter(space-between);
							width: 100%;
							margin-bottom: 5px;
							font-size: 16px;
							.price {
								font-weight: bold;
							}
						}
						.bottom {
							@include flexYCenter(space-between);
							width: 100%;
							font-size: 14px;
							color: #999;
							.spec {
								font-size: 12px;
								max-width: 80%;
							}
						}
					}
				}
		}
	}
</style>