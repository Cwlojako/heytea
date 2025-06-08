<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const menus = [
	{ title: '链接管理', index: 'Links' }
]

function go(name) {
	router.push({ name })
}

onMounted(() => {
	const name = menus[0].index
	router.replace({ name })
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
          <el-menu default-active="Links" @select="go" router>
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
					<el-card>
						<router-view />
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