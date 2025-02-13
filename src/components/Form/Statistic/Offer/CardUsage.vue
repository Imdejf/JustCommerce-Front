<template>
    <div>
        <el-row :gutter="14">
        <el-col :span="6">
            <div class="statistic-card text-center shadow-lg !bg-white-200">
            <el-statistic :value="5">
                <template #title>
                <div style="display: inline-flex; align-items: center">
                    <span class="text-lg">Obecny miesiąc</span>
                    <el-tooltip
                    effect="dark"
                    content="Liczba ofert w tym miesiącu"
                    placement="top"
                    >
                    <el-icon style="margin-left: 4px" :size="12">
                        <Warning />
                    </el-icon>
                    </el-tooltip>
                </div>
                </template>
            </el-statistic>
            <div class="statistic-footer !justify-center">
                <div class="footer-item">
                <span>Poprzedni miesiąc</span>
                <span class="green">
                    24%
                    <el-icon>
                    <CaretTop />
                    </el-icon>
                </span>
                </div>
            </div>
            </div>
        </el-col>
        <el-col :span="6">
            <div class="statistic-card text-center shadow-lg !bg-white-200">
            <el-statistic :value="5">
                <template #title>
                <div style="display: inline-flex; align-items: center">
                    <span class="text-lg">Zrealizowane</span>
                    <el-tooltip
                    effect="dark"
                    content="Liczba ofert w tym miesiącu"
                    placement="top"
                    >
                    <el-icon style="margin-left: 4px" :size="12">
                        <Warning />
                    </el-icon>
                    </el-tooltip>
                </div>
                </template>
            </el-statistic>
            <div class="statistic-footer !justify-center">
                <div class="footer-item">
                <span>Poprzedni miesiąc</span>
                <span class="green">
                    24%
                    <el-icon>
                    <CaretTop />
                    </el-icon>
                </span>
                </div>
            </div>
            </div>
        </el-col>
        <el-col :span="6">
            <div class="statistic-card text-center shadow-lg !bg-white-200">
            <el-statistic :value="5">
                <template #title>
                <div style="display: inline-flex; align-items: center">
                    <span class="text-lg">Potencjał</span>
                    <el-tooltip
                    effect="dark"
                    content="Liczba ofert w tym miesiącu"
                    placement="top"
                    >
                    <el-icon style="margin-left: 4px" :size="12">
                        <Warning />
                    </el-icon>
                    </el-tooltip>
                </div>
                </template>
            </el-statistic>
            <div class="statistic-footer !justify-center">
                <div class="footer-item">
                <span>Poprzedni miesiąc</span>
                <span class="green">
                    24%
                    <el-icon>
                    <CaretTop />
                    </el-icon>
                </span>
                </div>
            </div>
            </div>
        </el-col>
        <el-col :span="6">
            <div class="statistic-card text-center shadow-lg !bg-white-200">
            <el-statistic :value="5">
                <template #title>
                <div style="display: inline-flex; align-items: center">
                    <span class="text-lg">Średnia wartość</span>
                    <el-tooltip
                    effect="dark"
                    content="Liczba ofert w tym miesiącu"
                    placement="top"
                    >
                    <el-icon style="margin-left: 4px" :size="12">
                        <Warning />
                    </el-icon>
                    </el-tooltip>
                </div>
                </template>
            </el-statistic>
            <div class="statistic-footer !justify-center">
                <div class="footer-item">
                <span>Poprzedni miesiąc</span>
                <span class="green">
                    24%
                    <el-icon>
                    <CaretTop />
                    </el-icon>
                </span>
                </div>
            </div>
            </div>
        </el-col>
        </el-row>
    </div>
    <div class="mt-4">
        <el-progress :percentage="50" :stroke-width="15" striped />
        <span class="text-center w-full block">Oferty zrealizowane</span>
    </div>
  </template>
  
  <script lang="ts" setup>
  import {
    ArrowRight,
    CaretBottom,
    CaretTop,
    Warning,
  } from '@element-plus/icons-vue'
  </script>
  
  <style scoped>
  :global(h2#card-usage ~ .example .example-showcase) {
    background-color: var(--el-fill-color) !important;
  }
  
  .el-statistic {
    --el-statistic-content-font-size: 28px;
  }

  .el-progress-bar__innerText {
    width: 100% !important;
  }
  
  .statistic-card {
    height: 100%;
    padding: 20px;
    border-radius: 4px;
    background-color: var(--el-bg-color-overlay);
  }
  
  .statistic-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--el-text-color-regular);
    margin-top: 16px;
  }
  
  .statistic-footer .footer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .statistic-footer .footer-item span:last-child {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
  }
  
  .green {
    color: var(--el-color-success);
  }
  .red {
    color: var(--el-color-error);
  }
  </style>