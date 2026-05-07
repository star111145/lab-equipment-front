<template>
  <div class="number-input">
    <el-input-number
      v-model="innerValue"
      :min="min"
      :max="max"
      :step="1"
      class="main-input"
      @change="handleChange"
    />
    <div class="quick-adjust">
      <el-button
        type="info"
        size="small"
        @click="adjustValue(-10)"
        :disabled="innerValue < min + 10"
      >
        -10
      </el-button>
      <el-button
        type="info"
        size="small"
        @click="adjustValue(10)"
        :disabled="innerValue > max - 10"
      >
        +10
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'NumberInput',
  props: {
    modelValue: {
      type: Number,
      default: 0
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const innerValue = ref(props.modelValue)

    watch(() => props.modelValue, (newVal) => {
      innerValue.value = newVal
    })

    const adjustValue = (amount) => {
      const newValue = innerValue.value + amount
      if (newValue >= props.min && newValue <= props.max) {
        innerValue.value = newValue
        emit('update:modelValue', newValue)
        emit('change', newValue)
      }
    }

    const handleChange = (value) => {
      emit('update:modelValue', value)
      emit('change', value)
    }

    return {
      innerValue,
      adjustValue,
      handleChange
    }
  }
}
</script>

<style scoped>
.number-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.main-input {
  flex: 1;
}

.quick-adjust {
  display: flex;
  gap: 5px;
  margin-left: 20px;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
