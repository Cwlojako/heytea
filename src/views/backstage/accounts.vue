<script setup>
import { getTokens, setOrUpdateToken, deleteTokens } from '@/api/apis'
import { showToast } from 'vant'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const baseUrl = import.meta.env.VITE_BASE_URL
const pageData = reactive({
	page: 1,
	size: 50,
	total: 0
})
const queryParams = reactive({
	phone: ''
})
const formRef = ref()
const form = reactive({
	phone: '',
	token: ''
})
const dialogVisible = ref(false)
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
	let { data: res } = await getTokens(params)
	const { list = [], total = 0 } = res
	tableData.value = list
	pageData.total = total
}

function onSelectionChange(selected) {
	selectedRows.value = selected
}

function onEdit(row) {
	ElMessageBox.prompt(row.phone, '更新Token', {
		confirmButtonText: '确认',
		cancelButtonText: '取消'
	})
	.then(async ({ value }) => {
		await setOrUpdateToken(value, row.phone)
		ElMessage({ type: 'success', message: `更新成功` })
		getList()
	})
	.catch(() => {})
}

function onAdd() {
	dialogVisible.value = true
}

function onAddAccount(formEl) {
	formEl.validate(async (valid, fields) => {
		if (!valid) return
		await setOrUpdateToken(form.token, form.phone)
		dialogVisible.value = false
		getList()
	})
}

async function onDel() {
	const ids = selectedRows.value.map(m => m._id)
	await deleteTokens({ ids })
	ElMessage({ type: 'success', message: `删除成功` })
	getList()
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
					<el-form-item>
						<el-button type="primary" @click="getList">搜 索</el-button>
					</el-form-item>
				</el-form>
			</div>
			<div class="btn_box">
				<el-button type="primary" @click="onAdd">添加</el-button>
				<el-button type="danger" @click="onDel" :disabled="!selectedRows.length">删除</el-button>
			</div>
			<el-table
				:data="tableData"
				ref="tableRef"
				style="width: 100%"
				stripe
				border
				height="calc(100% - 52px - 50px - 50px)"
				@selection-change="onSelectionChange"
			>
				<el-table-column type="selection" width="55" />
				<el-table-column prop="phone" label="账号" />
				<el-table-column prop="value" label="Token">
					<template #default="scope">
						<el-icon
							v-if="scope.row.value"
							size="20"
							color="#1890ff"
							@click="onCopyUrl(scope.row.value)"
							style="cursor: pointer; margin-right: 10px; vertical-align: text-bottom;"
						>
							<CopyDocument />
						</el-icon>
						<span style="word-break: break-all;">{{ scope.row.value }}</span>
					</template>
				</el-table-column>
				<el-table-column fixed="right" label="操作" width="120">
					<template #default="scope">
						<el-button link type="primary" size="small" @click="onEdit(scope.row)">
							编辑
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

			<el-dialog
				v-model="dialogVisible"
				title="添加账号"
				width="500"
			>
				<el-form
					ref="formRef"
					:model="form"
					label-width="auto"
					:rules="{
						phone: { required: true, message: '请输入手机账号', trigger: 'blur' },
						token: { required: true, message: '请输入Token', trigger: 'blur' }
					}"
				>
					<el-form-item label="手机账号" prop="phone">
						<el-input v-model="form.phone" />
					</el-form-item>
					<el-form-item label="Token" prop="token">
						<el-input type="textarea" v-model="form.token" />
					</el-form-item>
				</el-form>
				<template #footer>
					<div class="dialog-footer">
						<el-button @click="dialogVisible = false">取消</el-button>
						<el-button type="primary" @click="onAddAccount(formRef)">确认</el-button>
					</div>
				</template>
			</el-dialog>
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