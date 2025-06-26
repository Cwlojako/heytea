<script setup>
import { closeOrOpenLink, getLinks, batchDelLink, findCoupon, batchBindCoupon } from '@/api/apis'
import { showToast } from 'vant'
import { CopyDocument } from '@element-plus/icons-vue'

const baseUrl = import.meta.env.VITE_BASE_URL
const pageData = reactive({
	page: 1,
	size: 50,
	total: 0
})
const queryParams = reactive({
	phone: '',
	uuid: '',
	status: '',
	date: [],
	price: ''
})
const tableData = ref([])
const selectedRows = ref([])
const tableRef = ref()
const status = ref([
	{ label: '已关闭', value: 0 },
	{ label: '生效中', value: 1 },
	{ label: '已下单', value: 2 },
])
const searchBox = ref()
const searchBoxHeight = ref(0)
const formRef = ref()
const couponDrawerVisible = ref(false)
const couponList = ref([])
const tabsActive = ref(0)
const coupons = ref([])
const isBatch = ref(false)
const currentRow = ref({})

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
	let { data: res } = await getLinks(params)
	const { list = [], total = 0 } = res
	tableData.value = list
	pageData.total = total
}

function onSelectionChange(selected) {
	selectedRows.value = selected
}

async function onToggleUrlStatus(uuids, close = true) {
	await closeOrOpenLink({ uuids, close })
	showToast(close ? '链接已失效' : '链接已恢复')
	getList()
}

function onBatchCancelUrl() {
	if (selectedRows.value.length === 0) {
		showToast('请至少选择一条记录')
		return
	}
	const uuids = selectedRows.value.map(item => item.uuid)
	onToggleUrlStatus(uuids)
}

function onBatchOpenUrl() {
	if (selectedRows.value.length === 0) {
		showToast('请至少选择一条记录')
		return
	}
	const uuids = selectedRows.value.map(item => item.uuid)
	onToggleUrlStatus(uuids, false)
}

async function onBatchDelUrl() {
	const ids = selectedRows.value.map(item => item._id)
	await batchDelLink({ ids })
	showToast('删除成功')
	getList()
}

function onReset(form) {
	form.resetFields()
	getList()
}

async function getCouponList(row) {
	const { phone, price } = row
	let params = { phone, price }
	let { data: res } = await findCoupon(params)
	couponList.value = res
}

async function onBindCoupon(row) {
	isBatch.value = false
	await getCouponList(row)
	currentRow.value = row
	couponDrawerVisible.value = true
}

async function onBatchBind() {
	isBatch.value = true
	const accounts = [...new Set(selectedRows.value.map(m => m.phone))].length
	if (accounts > 1) {
		return showToast('注意：存在不同账号，必须是同一账号才可以批量关联！')
	}
	let row = selectedRows.value[0]
	await getCouponList(row)
	couponDrawerVisible.value = true
}

function onChecked(item, isChange) {
	!isChange && (item.checked = !item.checked)
	if (isBatch.value) {
		if (item.checked) {
			coupons.value.push(item.id)
		} else {
			let idx = coupons.value.findIndex(f => f === item.id)
			coupons.value.splice(idx, 1)
		}
	} else {
		if (item.checked) {
			couponList.value.filter(i => i.id !== item.id).forEach(i => i.checked = false)
		}
	}
}

async function onConfirmBind() {
	couponDrawerVisible.value = false
	let params = null
	if (isBatch.value) {
		params = {
			uuids: selectedRows.value.map(m => m.uuid),
			couponIds: coupons.value
		}
	} else {
		let couponId = couponList.value.find(f => f.checked).id
		params = {
			uuids: [currentRow.value.uuid],
			couponIds: [couponId]
		}
	}
	await batchBindCoupon(params)
	showToast('批量关联优惠券成功')
	getList()
}

function closeDrawer() {
	coupons.value = []
}

function onBatchCopy() {
	const urls = selectedRows.value.map(m => m.url).join('\r\n')
	onCopyUrl(urls)
	selectedRows
}

const banClose = computed(() => {
	return selectedRows.value.length === 0 || selectedRows.value.some(item => [0, 2].includes(item.status))
})

const banOpen = computed(() => {
	return selectedRows.value.length === 0 || selectedRows.value.some(item => [1, 2].includes(item.status))
})

const tabList = computed(() => {
	return (idx, list) => {
		return list.filter(item => idx === 0 ? !item.disabled : item.disabled)
	}
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

const isAreadySelect = computed(() => {
	return isBatch.value ? coupons.value.length === selectedRows.value.length : couponList.value.some(s => s.checked)
})

onMounted(async () => {
	getList()
	await nextTick()
	searchBoxHeight.value = searchBox.value.clientHeight
})

</script>

<template>
	<div class="content_wrapper">
		<div class="search_box" ref="searchBox">
			<el-form inline :model="queryParams" @submit.native.prevent ref="formRef">
				<el-form-item label="手机账号" prop="phone">
					<el-input v-model="queryParams.phone" placeholder="手机账号，支持模糊查询" clearable style="width: 200px;"
						@change="getList" />
				</el-form-item>
				<el-form-item label="uuid" prop="uuid">
					<el-input v-model="queryParams.uuid" placeholder="uuid" clearable style="width: 200px;"
						@change="getList" />
				</el-form-item>
				<el-form-item label="价格" prop="price">
					<el-input v-model="queryParams.price" placeholder="价格" clearable style="width: 200px;"
						@change="getList" />
				</el-form-item>
				<el-form-item label="链接状态" prop="status">
					<el-select v-model="queryParams.status" placeholder="链接状态" style="width: 200px;">
						<el-option v-for="item in status" :key="item.value" :label="item.label" :value="item.value" />
					</el-select>
				</el-form-item>
				<el-form-item label="创建时间" prop="date">
					<el-date-picker v-model="queryParams.date" type="datetimerange" start-placeholder="开始日期"
						end-placeholder="结束日期" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
				</el-form-item>
				<el-form-item>
					<el-button @click="onReset(formRef)">重 置</el-button>
					<el-button type="primary" @click="getList">搜 索</el-button>
				</el-form-item>
			</el-form>
		</div>
		<div class="btn_box">
			<el-button type="warning" @click="onBatchCancelUrl" :disabled="banClose">关闭</el-button>
			<el-button type="primary" @click="onBatchOpenUrl" :disabled="banOpen">恢复</el-button>
			<el-button type="danger" @click="onBatchDelUrl" :disabled="!selectedRows.length">删除</el-button>
			<el-button type="primary" @click="onBatchBind" :disabled="!selectedRows.length">关联优惠券</el-button>
			<el-button type="success" @click="onBatchCopy" :disabled="!selectedRows.length">复制</el-button>
		</div>
		<el-table :data="tableData" ref="tableRef" style="width: 100%" stripe border
			:height="`calc(100% - 52px - ${searchBoxHeight}px - 50px)`" @selection-change="onSelectionChange">
			<el-table-column type="selection" width="55" />
			<el-table-column prop="phone" label="账号" width="120" />
			<el-table-column prop="uuid" label="uuid" width="150" />
			<el-table-column prop="price" label="价格" width="120" sortable>
				<template #default="scope">
					<span style="color: #1890ff;">￥{{ scope.row.price }}</span>
				</template>
			</el-table-column>
			<el-table-column prop="couponId" label="优惠券id" width="150">
				<template #default="scope">
					<el-button v-if="!scope.row.couponId" size="small" type="primary"
						@click="onBindCoupon(scope.row)">关联优惠券</el-button>
				</template>
			</el-table-column>
			<el-table-column prop="status" label="链接状态" width="100">
				<template #default="scope">
					<el-tag :type="scope.row.status === 0 ? 'danger' : scope.row.status === 1 ? 'primary' : 'success'">
						{{ scope.row.status === 0 ? '已关闭' : scope.row.status === 1 ? '生效中' : '已下单' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column prop="url" label="链接" width="240" show-overflow-tooltip>
				<template #default="scope">
					<el-icon v-if="scope.row.url" size="20" color="#1890ff" @click="onCopyUrl(scope.row.url)"
						style="cursor: pointer; margin-right: 10px; vertical-align: text-bottom;">
						<CopyDocument />
					</el-icon>
					<span style="word-break: break-all;">{{ scope.row.url }}</span>

				</template>
			</el-table-column>
			<el-table-column prop="orderAt" label="下单时间" width="160" />
			<el-table-column prop="createdAt" label="创建时间" width="160" />
			<el-table-column fixed="right" label="操作" min-width="120">
				<template #default="scope">
					<el-button link type="primary" size="small" @click="onToggleUrlStatus([scope.row.uuid])"
						:disabled="[0, 2].includes(scope.row.status)">
						关闭链接
					</el-button>
					<el-button link type="primary" size="small" @click="onToggleUrlStatus([scope.row.uuid], false)"
						:disabled="[1, 2].includes(scope.row.status)">
						恢复链接
					</el-button>
				</template>
			</el-table-column>
		</el-table>
		<div class="page_box">
			<el-pagination v-model:current-page="pageData.page" v-model:page-size="pageData.size"
				:page-sizes="[20, 50, 100, 200, 500]" background layout="sizes, prev, pager, next, total"
				:total="pageData.total" @size-change="getList" @current-change="getList" />
		</div>

		<el-drawer v-model="couponDrawerVisible" :show-close="false" @close="closeDrawer">
			<template #header>
				<section class="header_box">
					<div class="count_text" v-if="isBatch">
						{{ coupons.length }} / {{ selectedRows.length }}
					</div>
					<el-button type="primary" @click="onConfirmBind" :disabled="!isAreadySelect">
						确定
					</el-button>
				</section>
			</template>
			<div class="content_wrap">
				<el-tabs color="#000" v-model="tabsActive">
					<el-tab-pane :label="idx === 0 ? '可 用' : '不 可 用'" v-for="(item, idx) in 2" :key="idx" :name="idx">
						<div class="empty_box" v-if="!tabList(idx, couponList).length">
							<el-empty :description="idx === 0 ? '暂无可用优惠券' : '暂无不可用优惠券'" />
						</div>
						<div class="list_box" v-else>
							<div v-for="item in tabList(idx, couponList)" :key="item.id"
								:class="['list_item', { disabled: item.disabled }]" @click="onChecked(item)">
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
											<el-tag plain type="primary" v-if="item.bizLabels.length">{{
												LabelText(item.bizLabels[0]) }}</el-tag>
											<span>{{ item.name }}</span>
										</div>
										<div class="time">
											<span>{{ item.period_start }} ~ {{ item.period_end }}</span>
											<p class="expire" v-if="item.soon_expire">{{ item.periodText }}</p>
										</div>
									</section>
									<section @click.stop>
										<el-checkbox v-model="item.checked" :disabled="!!item.disabled"
											@change="(val) => onChecked(item, true)" />
									</section>
								</div>
							</div>
						</div>
					</el-tab-pane>
				</el-tabs>
			</div>
		</el-drawer>
	</div>
</template>

<style scoped lang="scss">
.content_wrapper {
	height: 100%;

	.search_box {
		height: fit-content;

		.el-form {
			height: 100%;
			display: flex;
			flex-wrap: wrap;
			gap: 10px;

			.el-form-item {
				margin: 0 10px 0 0;
				display: inline-flex;
				align-items: center;
			}
		}
	}

	.btn_box {
		height: 50px;
		display: flex;
		align-items: center;
	}

	.page_box {
		margin-top: 20px;
		display: flex;
		flex-direction: row-reverse;
	}

	.header_box {
		@include flexYCenter(space-between);
	}

	.content_wrap {
		height: 100%;
		overflow: hidden;

		::v-deep .el-tabs {
			height: 100%;
			overflow: hidden;

			.el-tab-pane {
				height: 100%;
			}
		}

		.list_box {
			box-sizing: border-box;
			padding: 16px;

			height: 100%;
			overflow: auto;

			.list_item {
				@include flexYCenter;
				position: relative;
				margin-bottom: 10px;
				background: #fff;
				min-height: 100px;
				border-radius: 5px;
				box-sizing: border-box;
				padding: 16px 0;
				border: 1px solid #f1f1f1;
				cursor: pointer;

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

	::v-deep .el-drawer__header {
		margin-bottom: 10px;
	}
}
</style>