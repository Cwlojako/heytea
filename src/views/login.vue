<script setup>
import { showToast } from 'vant'
import { login } from '@/api/user'
import { useUserState } from '@/stores/user'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const router = useRouter()
const userState = useUserState()

const onLogin = async () => {
	if (!username.value || !password.value) {
		showToast('请输入用户名和密码')
		return
	}
	const { data: res } = await login({ username: username.value, password: password.value })
	userState.setUser(res)
	router.push({ name: 'Setting' })
}
</script>

<template>
	<div class="login-bg">
		<div class="img-box">
			<van-image width="150" height="150"
				src="https://static.heytea.com/taro_trial/v1/img/my/me_img_head_login.png" round />
		</div>
		<div class="login-box">
			<van-form @submit="onLogin">
				<van-cell-group inset>
					<van-field v-model="username" name="username" label="用户名" placeholder="请输入用户名" :border="false"
						required left-icon="user-o" />
					<van-field v-model="password" type="password" name="password" label="密码" placeholder="请输入密码"
						:border="false" required left-icon="lock" />
				</van-cell-group>
				<div style="margin: 24px 0;">
					<van-button round block type="primary" native-type="submit">
						登 录
					</van-button>
				</div>
			</van-form>
		</div>
	</div>
</template>

<style scoped lang="scss">
.login-bg {
	min-height: 100vh;
	background: #000;
	overflow: auto;

	.img-box {
		@include flexCenter;
		width: 100%;
		margin: 40px 0;
	}

	.login-box {
		background: #fff;
		padding: 32px 24px;
		border-radius: 12px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
		width: 320px;
		max-width: 90vw;
		margin: 0 auto;
	}
}
</style>