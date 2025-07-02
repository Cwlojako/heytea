<script setup>
import { addGroup, editGroup, getGroups } from '@/api/group'
import { getAccounts, setOrUpdateToken } from '@/api/token'
import { showToast } from 'vant'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const dialogVisible = ref(false)
const groupVisible = ref(false)
const baseUrl = import.meta.env.VITE_BASE_URL
const phone = ref('')
const token = ref('')
const groupId = ref('')
const groupId_name = ref('')
const groupName = ref('')
const groups = ref([])
const pickerValue = ref([])
const activeName = ref('')
const list = ref([])
const isEdit = ref(false)
const showPicker = ref(false)
const currItem = ref({})
const currGroup = ref({})

function onAdd() {
    isEdit.value = false
    phone.value = ''
    token.value = ''
    groupId_name.value = ''
    dialogVisible.value = true
}

async function onConfirm() {
    const params = {
        token: token.value,
        phone: phone.value
    }
    if (groupId_name.value) {
        params.groupId = pickerValue.value[0]
    }
    if (isEdit.value) {
        const res = await setOrUpdateToken(params)
        showToast('修改成功')
        getList()
    } else {
        const res = await setOrUpdateToken(params)
        showToast('新增成功')
        list.value.push({
            phone: phone.value,
            token: token.value
        })
        token.value = ''
        phone.value = ''
        groupId_name.value = ''
    }
    dialogVisible.value = false
}

function onAddGroup() {
    isEdit.value = false
    groupVisible.value = true
    _getGroups()
}

async function onAddGroupConfirm() {
    const fetchApi = isEdit.value ? editGroup : addGroup
    const params = isEdit.value ? { name: groupName.value, groupId: currGroup.value._id } : { name: groupName.value }
    await fetchApi(params)
    groupVisible.value = false
    groupName.value = ''
    _getGroups()
}

async function onGroupConfirm({ selectedValues, selectedOptions }) {
    groupId_name.value = selectedOptions[0].text
    showPicker.value = false
    pickerValue.value = selectedValues
}

function onEdit(item) {
    dialogVisible.value = true
    isEdit.value = true
    token.value = item.token
    phone.value = item.phone
    groupId_name.value = groups.value.find(f => f._id === item.groupId)?.name ?? ''
    currItem.value = item
}

async function getList() {
    const { data: res } = await getAccounts()
    list.value = res.map(m => {
        return {
            ...m,
            phone: m.phone,
            token: m.value
        }
    })
}

async function _getGroups() {
    const { data: res } = await getGroups()
    groups.value = res.map(m => {
        return {
            ...m,
            text: m.name,
            value: m._id
        }
    }).sort((a, b) => (a.name === '默认分组' ? -1 : b.name === '默认分组' ? 1 : 0))
}

const listInGroup = computed(() => {
    return (item) => {
        if (item.name === '默认分组') {
            return list.value.filter(f => (f.groupId === item._id) || !f.groupId)
        } else {
            return list.value.filter(f => f.groupId === item._id)
        }
    }
})

onMounted(() => {
    getList()
    _getGroups()
})
</script>

<template>
    <div class="list_wrap">
        <van-contact-card type="add" @click="onAddGroup" add-text="添加分组" />
        <van-contact-card type="add" @click="onAdd" add-text="添加账号" />
        <div class="account_list_box">
            <p class="title">账号列表</p>
            <div class="scroll_box">
                <van-collapse v-model="activeName" accordion>
                    <van-collapse-item v-for="(item, index) in groups" :name="item.value">
                        <template #title>
                            <div>
                                {{ item.text }}
                                <van-icon v-if="item.name !== '默认分组'"
                                    @click.stop="groupName = item.name, isEdit = true, groupVisible = true, currGroup = item"
                                    name="edit" color="#1989fa" size="20" style="margin-left:5px;" />
                            </div>
                        </template>
                        <van-cell-group v-if="listInGroup(item).length">
                            <van-cell v-for="(i, idx) in listInGroup(item)" class="inner_cell" :key="i.phone"
                                :title="i.phone" :label="i.token" is-link @click="onEdit(i)" />
                        </van-cell-group>
                        <div v-else>该分组暂无账号</div>
                    </van-collapse-item>
                </van-collapse>
            </div>
        </div>
        <div class="bottom_btn">
            <van-button type="primary" @click="router.go(-1)" block>返 回</van-button>
        </div>
        <van-dialog v-model:show="dialogVisible" :title="isEdit ? '编辑账号' : '添加账号'" show-cancel-button
            @confirm="onConfirm">
            <van-field label="手机号" v-model="phone" type="number" placeholder="请输入" :disabled="isEdit" />
            <van-field v-model="token" rows="1" autosize :spellcheck="false" label="Token" type="textarea"
                placeholder="请输入" />
            <van-field v-model="groupId_name" is-link readonly label="分组" placeholder="不选默认在【默认分组】"
                @click="showPicker = true" />
        </van-dialog>
        <van-dialog v-model:show="groupVisible" :title="isEdit ? '编辑分组' : '添加分组'" show-cancel-button
            @confirm="onAddGroupConfirm">
            <van-field label="分组名称" v-model="groupName" placeholder="请输入分组名称" />
        </van-dialog>
        <van-popup v-model:show="showPicker" destroy-on-close round position="bottom">
            <van-picker :model-value="pickerValue" :columns="groups" @cancel="showPicker = false"
                @confirm="onGroupConfirm" />
        </van-popup>
    </div>

</template>

<style scoped lang="scss">
.list_wrap {
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;

    ::v-deep .van-dialog__header {
        background: #fff !important;
        padding: 16px 0;
    }

    .account_list_box {
        height: calc(100% - 56px - 56px);

        .title {
            @include flexCenter;

            position: relative;
            height: 60px;
            font-weight: bold;

            &::after {
                @include bottom-line(#ccc);
            }
        }

        ::v-deep .van-cell__title {
            width: 100%;
        }

        ::v-deep .van-cell__label {
            word-break: break-all;
            @include ellipsis_n(2);
        }

        .scroll_box {
            height: calc(100% - 60px - 44px - env(safe-area-inset-bottom));
            overflow-y: auto;
            box-sizing: border-box;

            ::v-deep .van-collapse-item__content {
                background-color: #f1f1f1;
            }
        }
    }

    .bottom_btn {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        padding-bottom: env(safe-area-inset-bottom);
    }
}
</style>