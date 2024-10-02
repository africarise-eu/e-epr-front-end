<script setup lang="ts">
import Logo from '@/layouts/dashboard/logo/LogoDark.vue';
import AuthLogin from '../authForms/AuthLogin.vue';
</script>

<template>
  <v-row class="bg-containerBg position-relative" no-gutters>
    <v-col cols="12">
      <div class="pt-6 pl-6">
        <Logo />
      </div>
    </v-col>
    <!---Login Part-->
    <v-col cols="12" lg="12" class="d-flex align-center">
      <v-container class="py-0">
       <div class="d-flex align-center justify-center">
          <v-row justify="center">
             <v-col cols="12" md="12">
               <h3 class="text-h3 text-center mb-0" style="font-size: 2.375rem !important;">{{ $t('authentication.head.logTitle') }}</h3>
             </v-col>
          </v-row>
       </div>
      </v-container>
    </v-col>
    <v-col cols="12" lg="12" class="d-flex">
      <v-container class="pa-0">
        <div class="d-flex  justify-center" style="min-height: calc(100vh - 350px)">
          <v-row justify="center">
            <v-col cols="12" md="12">
              <v-card elevation="0" class="loginBox_main">
                <v-card elevation="24">
                  <v-card-text class="pa-sm-10 pa-6">
                    <v-row>
                        <v-col  lg="6" md="6" sm="12" class="align-center">
                          <v-card elevation="24">
                  <v-card-text class="pa-sm-10 pa-6">
                    <!---Login Form-->
                    <AuthLogin />
                    <!---Login Form-->
                  </v-card-text>
                          </v-card>
        
                        </v-col>
                          <v-col lg="6"  md="6" sm="12" class="align-center">
                              <img width="120px" style="min-height: 400px; min-width: 400px" src="@/assets/images/logo_image.jpg" alt="TAEIMAGE" />
                          </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-card>
            </v-col>
          </v-row>
        </div>
         </v-container>
       </v-col>
    <!---Login Part-->
  </v-row>
</template>
<style lang="scss">
.loginBox_main {
  max-width: 1000px;
  margin: 0 auto;
}
.blur-logo {
  position: absolute;
  filter: blur(18px);
  bottom: 0;
  transform: inherit;
}
</style>
