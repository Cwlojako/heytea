<script setup>
	import { getAccounts, setOrUpdateToken } from '@/api/apis'
	import { showToast } from 'vant'
	import { useRoute, useRouter } from 'vue-router'

	const router = useRouter()
    const dialogVisible = ref(false)
    const baseUrl = import.meta.env.VITE_BASE_URL
    const phone = ref('')
    const token = ref('')
    const list = ref([])
    const isEdit = ref(false)

    function onAdd() {
        isEdit.value = false
        phone.value = ''
        token.value = ''
        dialogVisible.value = true
    }

    async function onConfirm() {
        if (isEdit.value) {
            const res = await setOrUpdateToken(token.value, phone.value)
            showToast('修改成功')
            getList()
        } else {
            const res = await setOrUpdateToken(token.value, phone.value)
            showToast('新增成功')
            list.value.push({
                phone: phone.value,
                token: token.value
            })
            token.value = ''
            phone.value = ''
        }
        dialogVisible.value = false
	}

    function onEdit(item) {
        dialogVisible.value = true
        isEdit.value = true
        token.value = item.token
        phone.value = item.phone
    }

    async function getList() {
        const { data: res } = await getAccounts()
        list.value = res.map(m => {
            return {
                phone: m.phone,
                token: m.value
            }
        })
    }

    onMounted(() => {
        getList()
    })
</script>

<template>
    <div class="list_wrap">
        <van-contact-card type="add" @click="onAdd" add-text="添加账号"/>
        <div class="account_list_box">
            <p class="title">账号列表</p>
            <div class="scroll_box">
                <van-cell-group>
                    <van-cell
                        v-for="(item, index) in list"
                        :key="item.phone"
                        :title="item.phone"
                        :label="item.token"
                        is-link
                        @click="onEdit(item)"
                    />
                </van-cell-group>
            </div>
        </div>
        <div class="bottom_btn">
            <van-button type="primary" @click="router.go(-1)" block>返 回</van-button>
        </div>
        <van-dialog
            v-model:show="dialogVisible"
            :title="isEdit ? '编辑账号' : '添加账号'"
            show-cancel-button
            @confirm="onConfirm"
        >
            <van-field
                label="手机号"
                v-model="phone"
                type="number"
                placeholder="请输入"
                :disabled="isEdit"
            />
            <van-field
                v-model="token"
                rows="1"
                autosize
                :spellcheck="false"
                label="Token"
                type="textarea"
                placeholder="请输入"
            />
        </van-dialog>
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
            height: calc(100% - 56px);
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