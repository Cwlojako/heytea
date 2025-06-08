<script setup>
import axios from 'axios'
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
	uuid: ''
})
const tableData = ref([])
const selectedRows = ref([])

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
	let params = {
		...pageData,
		...queryParams
	}
  let { data: res } = await axios.post(`${baseUrl}/getLinks`, params)
	const { list = [], total = 0 } = res.data
	tableData.value = list.map(m => {
		return {
			...m,
			createdAt: new Date(m.createdAt).toLocaleString()
		}
	})
	pageData.total = total
}

function onSelectionChange(selected) {
	selectedRows.value = selected
}

async function onCancelUrl(uuids) {
	await axios.post(`${baseUrl}/closeLink`, { uuids })
	showToast('链接已失效')
	getList()
}

function onBatchCancelUrl() {
	if (selectedRows.value.length === 0) {
		showToast('请至少选择一条记录')
		return
	}
	const uuids = selectedRows.value.map(item => item.uuid)
	onCancelUrl(uuids)
}

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
					<el-form-item label="uuid">
						<el-input
							v-model="queryParams.uuid"
							placeholder="uuid"
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
			<div class="btn_box">
				<el-button type="warning" @click="onBatchCancelUrl" :disabled="!selectedRows.length">关闭链接</el-button>
			</div>
			<el-table
				:data="tableData"
				style="width: 100%"
				stripe
				border
				height="calc(100% - 52px - 50px - 50px)"
				@selection-change="onSelectionChange"
			>
					<el-table-column type="selection" width="55" />
					<el-table-column prop="phone" label="账号" width="120" />
					<el-table-column prop="uuid" label="uuid" width="150" />
					<el-table-column prop="price" label="价格" width="120">
						<template #default="scope">
							<span style="color: #1890ff;">￥{{ scope.row.price }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="couponId" label="优惠券id" width="150" />
					<el-table-column prop="isClose" label="是否关闭" width="100">
						<template #default="scope">
							<el-tag :type="scope.row.isClose ? 'danger' : 'primary'">
								{{ scope.row.isClose ? '已关闭' : '生效中' }}
							</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="url" label="链接" width="200">
							<template #default="scope">
									<span style="word-break: break-all;">{{ scope.row.url }}</span>
									<el-icon
										v-if="scope.row.url"
										size="20"
										color="#1890ff"
										@click="onCopyUrl(scope.row.url)"
										style="cursor: pointer; margin-left: 10px; vertical-align: text-bottom;"
									>
										<CopyDocument />
									</el-icon>
							</template>
					</el-table-column>
					<el-table-column prop="createdAt" label="创建时间" width="160" />
					<el-table-column fixed="right" label="操作" min-width="120">
						<template #default="scope">
							<el-button link type="primary" size="small" @click="onCancelUrl([scope.row.uuid])" :disabled="scope.row.isClose">
								关闭链接
							</el-button>
						</template>
					</el-table-column>
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
	}
</style>