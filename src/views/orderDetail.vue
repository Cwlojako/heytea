<script setup>
    import { orderDetail, getExpectTime, getLinkDetails } from '@/api/apis'
    import { showToast } from 'vant'
	import { useRoute } from 'vue-router'
    import { decrypt } from '@/utils/crypto'

    const baseUrl = import.meta.env.VITE_BASE_URL
    const route = useRoute()
    const orderInfo = ref({})
    const expectTimeObj = ref({})
    const phone = ref('')
    const timeout = ref(null)
    async function getOrderDetail() {
        const { u } = route.params
        const { data: res } = await orderDetail(u, phone.value)
        orderInfo.value = res.orderInfo
    }

    async function getTime() {
        const { id, no } = orderInfo.value
        const { data: res } = await getExpectTime(id, no, phone.value)
        expectTimeObj.value = res[0]
    }

    function onCopy(text) {
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

    async function _getLinkDetails() {
		const { data: res } = await getLinkDetails(route.params.u)
		phone.value = decrypt(res.phone)
	}

    const specsText = computed(() => {
        return (item) => {
            return item.materials.data.map((m) => m.name).join('，')
        }
    })

    const expectText = computed(() => {
        const { completedAt = null } = orderInfo.value
        if (completedAt) {
            return `已制作完成，请取茶！`
        }
        if (!expectTimeObj.value || !Object.keys(expectTimeObj.value).length) {
            return '下单成功请稍等...'
        } else {
            const { totalCups, expectMakingTime } = expectTimeObj.value
            return expectMakingTime === 0 ? `已制作完成，请取茶！` : `${totalCups}杯制作中，很快就好，预计等待${expectMakingTime}分钟`
        }
    })

    const isRefund = computed(() => {
        const { button } = orderInfo.value
        return button && button.length && button.some(s => s.code === 'refund_detail')
    })

    const isMaked = computed(() => {
        const { completedAt = null } = orderInfo.value
        const { expectMakingTime } = expectTimeObj.value
        return !!completedAt || expectMakingTime === 0
    })

    onMounted(async () => {
        await _getLinkDetails()
        await getOrderDetail()
        if (!orderInfo.value.completedAt) {
            timeout = setTimeout(() => {
                getTime()
            }, 5000)
        }
    })

    onBeforeUnmount(() => {
        clearTimeout(timeout)
    })
</script>

<template>
    <div class="wrapper">
        <section class="refund_box" v-if="isRefund">
            <span class='text'>已退款取消</span>
        </section>
        <section class="pick_no_box" v-else>
            <p class="text">取茶号</p>
            <div class="number_box" v-if="orderInfo.pickup_no">
                <span class="number" v-for="i in orderInfo.pickup_no.split('')">
                    {{ i }}
                </span>
            </div>
            <div class="expect_box">
                <span>{{ expectText }}</span>
                <van-icon
                    v-if="!isMaked"
                    name="replay"
                    color="#1989fa"
                    size="18"
                    style="margin-left: 5px;"
                    @click="getTime"
                />
            </div>
        </section>
        <section class="product_box">
            <div class="top_area">
                <span class="shop_name">{{ orderInfo.shop?.name }}</span>
            </div>
            <div class="product_area">
                <div class="product_item" v-for="item in orderInfo.items?.data" :key="item.id">
                    <van-image :src="item.images.data[0].url" width="60" height="60" fit="cover"/>
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
            <div class="total_price_area">
                <span>商品总价</span>
                <span class="price">￥{{ orderInfo.total_fee }}</span>
            </div>
        </section>
        <section class="info_box">
            <div class="top_area">
                <span class="title">订单信息</span>
            </div>
            <div class="info_area">
                <van-field v-model="orderInfo.created_at" label="下单时间：" />
                <van-field v-model="orderInfo.pickup_no" label="取茶号：" />
                <van-field v-model="orderInfo.no" label="订单编号：" >
                    <template #button>
                        <van-button size="small" @click="onCopy(orderInfo.no)">复制</van-button>
                    </template>
                </van-field>
                <van-field v-model="orderInfo.remarks" label="备注信息：" />
            </div>
        </section>
    </div>
</template>

<style lang="scss" scoped>
.wrapper {
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    background: linear-gradient(to bottom, #000 20%, #f1f1f1 20%);
    overflow: auto;
    padding: 0 16px 16px;
    color: #343434;
    .refund_box {
        @include flexCenterColumn;
        background: #fff;
        margin: 80px auto 0;
        padding: 16px 0;
        box-sizing: border-box;
        text-align: center;
        height: 150px;
        border-radius: 2px;
        font-size: 20px;
        letter-spacing: 2px;
        font-weight: bold;
    }
    .pick_no_box {
        @include flexCenterColumn;
        background: #fff;
        margin: 80px auto 0;
        padding: 16px 0;
        box-sizing: border-box;
        text-align: center;
        height: 150px;
        border-radius: 2px;
        .text {
            font-weight: bold;
        }
        .number_box {
            font-weight: bold;
            margin-top: 10px;
            font-size: 30px;
            .number {
                border: 1px solid #999;
                margin: 0 5px;
                padding: 5px 10px;
                display: inline-block;
                border-radius: 5px;
            }
        }
        .expect_box {
            margin-top: 10px;;
        }
    }
    .product_box {
        padding: 16px;
        background: #fff;
        margin-top: 10px;
        border-radius: 2px;
        .top_area {
            position: relative;
            padding-bottom: 10px;
            &::after {
                @include bottom-line();
            }
        }
        .product_area {
            position: relative;
            &::after {
                @include bottom-line();
            }
            .product_item {
                display: flex;
                gap: 10px;
                padding: 20px 0;
                .van-image {
                    flex: 0 0 60px;
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
        .total_price_area {
            @include flexYCenter(space-between);
            padding: 10px 0 0;
            font-size: 16px;
            .price {
                font-weight: bold;
            }
        }
    }
    .info_box {
        padding: 16px;
        background: #fff;
        margin-top: 10px;
        border-radius: 2px;
        .top_area {
            position: relative;
            padding-bottom: 10px;
            &::after {
                @include bottom-line();
            }
            .title {
                font-size: 16px;
            }
        }
        .info_area {
            .van-cell {
                padding: 10px 0;
                ::v-deep .van-field__label {
                    color: #999999;
                }
            }
        }
    }
}
</style>