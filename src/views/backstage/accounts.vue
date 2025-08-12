<script setup>
import { exchangeCoupon } from '@/api/coupon'
import { getTokens, setOrUpdateToken, deleteTokens, getNewToken } from '@/api/token'
import { showToast } from 'vant'
import { CopyDocument, EditPen, Ticket } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { encrypt } from '@/utils/crypto'

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
const currentRow = ref({})
const couponDialogVisible = ref(false)
const codes = ref('')
const editVisible = ref(false)
const editRow = ref({})
const authCode = ref('')
const token = ref('')

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
	editVisible.value = true
	editRow.value = row
}

function onAdd() {
	dialogVisible.value = true
}

function onAddAccount(formEl) {
	formEl.validate(async (valid, fields) => {
		if (!valid) return
		const params = {
			token: form.token,
			phone: form.phone
		}
		await setOrUpdateToken(params)
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

async function onExchange() {
	let codeArr = codes.value.split('\n')
	try {
		couponDialogVisible.value = false
		await exchangeCoupon({ codes: codeArr, phone: currentRow.value.phone })
		showToast('兑换成功')
	} catch (e) {
		couponDialogVisible.value = false
		codes.value = ''
		ElMessage({
			showClose: true,
			dangerouslyUseHTMLString: true,
			message: e.data.message,
			type: 'error',
		})
	}
}

async function onGetNewToken() {
	const params = {
		encryptPhone: editRow.value.encryptPhone,
		phone: editRow.value.phone,
		authCode: authCode.value
	}
	const { data: res } = await getNewToken(params)
	token.value = res.token
}

async function onConfirmNewToken() {
	const params = {
		token: token.value,
		phone: editRow.value.phone
	}
	await setOrUpdateToken(params)
	editVisible.value = false
	ElMessage({ type: 'success', message: `更新成功` })
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
					<el-input v-model="queryParams.phone" placeholder="手机账号，支持模糊查询" clearable style="width: 200px;"
						@change="getList" />
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
		<el-table :data="tableData" ref="tableRef" style="width: 100%" stripe border
			height="calc(100% - 52px - 50px - 50px)" @selection-change="onSelectionChange">
			<el-table-column type="selection" width="55" />
			<el-table-column prop="phone" label="账号" width="200">
				<template #default="scope">
					<div style="display: flex;">
						<span>{{ scope.row.phone }}</span>
						<el-tag size="small" style="margin-left: 5px;" type="success">{{ scope.row.groupName || '默认分组'
						}}</el-tag>
					</div>
				</template>
			</el-table-column>
			<el-table-column prop="value" label="Token">
				<template #default="scope">
					<el-icon v-if="scope.row.value" size="20" color="#1890ff" @click="onCopyUrl(scope.row.value)"
						style="cursor: pointer; margin-right: 10px; vertical-align: text-bottom;">
						<CopyDocument />
					</el-icon>
					<span style="word-break: break-all;">{{ scope.row.value }}</span>
				</template>
			</el-table-column>
			<el-table-column fixed="right" label="操作" width="200">
				<template #default="scope">
					<el-tooltip effect="dark" content="编辑" placement="top">
						<el-button type="primary" :icon="EditPen" circle size="small" @click="onEdit(scope.row)" />
					</el-tooltip>
					<el-tooltip effect="dark" content="兑换优惠券" placement="top">
						<el-button type="warning" :icon="Ticket" circle size="small"
							@click="couponDialogVisible = true, currentRow = scope.row" />
					</el-tooltip>
				</template>
			</el-table-column>
		</el-table>
		<div class="page_box">
			<el-pagination v-model:current-page="pageData.page" v-model:page-size="pageData.size"
				:page-sizes="[20, 50, 100, 200, 500]" background layout="sizes, prev, pager, next, total"
				:total="pageData.total" @size-change="getList" @current-change="getList" />
		</div>

		<el-dialog v-model="dialogVisible" title="添加账号" width="500">
			<el-form ref="formRef" :model="form" label-width="auto" :rules="{
				phone: { required: true, message: '请输入手机账号', trigger: 'blur' },
				token: { required: true, message: '请输入Token', trigger: 'blur' }
			}">
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

		<el-dialog v-model="couponDialogVisible" title="优惠券兑换" width="500">
			<el-input v-model="codes" :autosize="{ minRows: 2, maxRows: 8 }" type="textarea"
				placeholder="请输入兑换码，多个时使用回车换行分隔开" />
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="dialogFormVisible = false">取消</el-button>
					<el-button type="primary" @click="onExchange">
						确认
					</el-button>
				</div>
			</template>
		</el-dialog>

		<el-dialog
			v-model="editVisible"
			title="更新Token"
			width="500"
		>
			<div class="phone_box">
				<span>手机账号：{{ editRow.phone }}</span>
			</div>
			<div class="code_box">
				<span>验证码：</span>
				<el-input v-model="authCode" style="width: 200px;" placeholder="请从喜茶APP中获取验证码"/>
				<el-button type="warning" size="medium" @click="onGetNewToken" style="margin-left: 20px;" :disabled="!authCode || authCode.length !== 6">获取Token</el-button>
			</div>
			<div class="token_box">
				<span>新Token：</span>
				<el-input type="textarea" v-model="token" :disabled="!!authCode"/>
			</div>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="editVisible = false">取消</el-button>
					<el-button type="primary" @click="onConfirmNewToken" :disabled="!token">
						确认
					</el-button>
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
	.phone_box, .code_box, .token_box {
		margin-bottom: 20px;
		display: flex;
		align-items: center;

		span {
			min-width: 70px;
		}
		.code_btn {
			margin-left: 20px;
		}
	}
}
</style>