<script setup>
import { useRouter, useRoute } from 'vue-router'

const baseUrl = import.meta.env.VITE_BASE_URL
const router = useRouter()
const route = useRoute()
const defaultActive = ref('')

let menus = []
if (baseUrl === 'http://47.106.130.54:1129') {
	menus = [
		{ title: '链接管理', index: 'Links' }
	]
} else {
	menus = [
		{ title: '链接管理', index: 'Links' },
		{ title: '账号管理', index: 'Accounts' },
		{ title: '订单管理', index: 'Orders' }
	]
}

function go(name) {
	defaultActive.value = name
	router.push({ name })
}

onMounted(() => {
	const { name } = route
	defaultActive.value = name
})
</script>

<template>
  <div class="common_wrapper">
    <el-container>
      <el-header>
        <h2>喜茶兑换后台管理</h2>
      </el-header>
      <el-container class="bottom_container">
        <el-aside width="200px">
          <el-menu @select="go" router :default-active="defaultActive">
            <el-menu-item 
					v-for="(item, idx) in menus"
					:index="item.index"
					:key="idx"
				>
					{{ item.title }}
				</el-menu-item>
			</el-menu>
        </el-aside>
        <el-main>
					<el-card v-if="route.name !== 'Backstage'">
						<router-view />
					</el-card>
					<el-card v-else class="welcome_box">
						欢迎
					</el-card>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.common_wrapper {
  height: 100vh;
	width: 100vw;
	box-sizing: border-box;
	.el-header {
		background: #000;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.bottom_container {
		height: calc(100vh - 60px);
		.el-aside {
			background: #001529;
			overflow: overlay;
			.el-menu {
				.el-menu-item {
					color: #fff;
					background-color: #001529;
					&.is-active {
						background: #1890ff;
					}
				}
			}
		}
		.el-main {
			height: calc(100vh - 60px);
			box-sizing: border-box;
			padding: 16px;
			background-color: #f1f1f1;
			.el-card {
				height: 100%;
				box-sizing: border-box;
				::v-deep .el-card__body {
					height: 100%;
					box-sizing: border-box;
				}
			}
		}
	}
}
</style>