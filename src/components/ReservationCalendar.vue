<template>
  <div class="reservation-calendar">
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
  </div>
</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { getCalendarReservations } from '@/api/request'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { websocketClient } from '@/utils/websocket'

export default {
  name: 'ReservationCalendar',
  components: {
    FullCalendar
  },
  props: {
    equipmentId: {
      type: Number,
      required: true
    },
    timeSlot: {
      type: String,
      default: 'all'
    },
    statusFilter: {
      type: String,
      default: ''
    }
  },
  emits: ['dateSelect', 'eventClick'],
  setup(props, { emit }) {
    const calendarRef = ref(null)
    const events = ref([])
    const loading = ref(false)
    
    onMounted(() => {
      setTimeout(() => {
        const calendarApi = calendarRef.value?.getApi()
        if (calendarApi) {
          const start = calendarApi.view.activeStart
          const end = calendarApi.view.activeEnd
          fetchEvents(formatDateForApi(start), formatDateForApi(end))
        }
      }, 100)
      
      websocketClient.on('reservation_refresh', handleWsMessage)
    })
    
    const handleWsMessage = () => {
      const calendarApi = calendarRef.value?.getApi()
      if (calendarApi) {
        const start = calendarApi.view.activeStart
        const end = calendarApi.view.activeEnd
        fetchEvents(formatDateForApi(start), formatDateForApi(end))
      }
    }
    
    onUnmounted(() => {
      websocketClient.off('reservation_refresh', handleWsMessage)
    })
    
    const formatDateForApi = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    }
    
    watch(() => props.equipmentId, () => {
      if (props.equipmentId) {
        const calendarApi = calendarRef.value?.getApi()
        if (calendarApi) {
          const start = calendarApi.view.activeStart
          const end = calendarApi.view.activeEnd
          fetchEvents(formatDateForApi(start), formatDateForApi(end))
        }
      }
    })
    
    watch(() => props.timeSlot, () => {
      const calendarApi = calendarRef.value?.getApi()
      if (calendarApi) {
        calendarApi.render()
      }
    })

    watch(() => props.statusFilter, () => {
      const calendarApi = calendarRef.value?.getApi()
      if (calendarApi) {
        const start = calendarApi.view.activeStart
        const end = calendarApi.view.activeEnd
        fetchEvents(formatDateForApi(start), formatDateForApi(end))
      }
    })
    
    const getEventTitle = (item) => {
      return item.userName || '预约'
    }

    const getEventStatus = (item) => {
      if (item.auditStatus === 0) return '待审核'
      if (item.reserveStatus === 1) return '已通过'
      return ''
    }

    const calculateEndTime = (startTime, duration) => {
      const dateStr = startTime.replace(' ', 'T')
      const start = new Date(dateStr)
      start.setHours(start.getHours() + duration)
      return start
    }

    const getEventColor = (item) => {
      if (item.auditStatus === 0) return '#E6A23C'
      if (item.reserveStatus === 2) return '#909399'
      if (item.reserveStatus === 3) return '#F56C6C'
      if (item.reserveStatus === 1) {
        const endTime = new Date(item.reserveTime)
        endTime.setHours(endTime.getHours() + item.reserveDuration)
        if (endTime < new Date()) return '#909399'
        return '#67C23A'
      }
      return '#409EFF'
    }

    const fetchEvents = async (start, end) => {
      loading.value = true
      try {
        const res = await getCalendarReservations({
          equipmentId: props.equipmentId,
          start: start,
          end: end
        })

        if (res.data && Array.isArray(res.data)) {
          const mappedEvents = res.data.map(item => {
            const eventStatus = getEventStatus(item)
            return {
              id: item.id,
              title: getEventTitle(item),
              start: item.reserveTime,
              end: calculateEndTime(item.reserveTime, item.reserveDuration),
              backgroundColor: getEventColor(item),
              borderColor: getEventColor(item),
              extendedProps: {
                id: item.id,
                status: item.reserveStatus,
                auditStatus: item.auditStatus,
                eventStatus: eventStatus,
                userId: item.userId,
                userName: item.userName,
                purpose: item.purpose,
                reserveDuration: item.reserveDuration
              }
            }
          })
          let filteredEvents = mappedEvents
          if (props.statusFilter === '待审核') {
            filteredEvents = mappedEvents.filter(item => item.extendedProps.eventStatus === '待审核')
          } else if (props.statusFilter === '已通过') {
            filteredEvents = mappedEvents.filter(item => item.extendedProps.eventStatus === '已通过')
          } else if (props.statusFilter === 'none') {
            filteredEvents = []
          }
          events.value = filteredEvents
        }
      } catch (error) {
        console.error('获取预约数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    const handleDateSelect = (selectInfo) => {
      const start = selectInfo.startStr
      const end = selectInfo.endStr
      emit('dateSelect', { start, end })
      calendarRef.value?.getApi().unselect()
    }

    const handleEventClick = (clickInfo) => {
      emit('eventClick', {
        id: clickInfo.event.id,
        title: clickInfo.event.title,
        start: clickInfo.event.startStr,
        end: clickInfo.event.endStr,
        ...clickInfo.event.extendedProps
      })
    }

    const handleDatesSet = (dateInfo) => {
      const start = new Date(dateInfo.start)
      const end = new Date(dateInfo.end)
      fetchEvents(formatDateForApi(start), formatDateForApi(end))
    }

    const getTimeSlotRange = (slot) => {
      switch(slot) {
        case 'morning': return { min: '00:00:00', max: '12:00:00' }
        case 'afternoon': return { min: '12:00:00', max: '23:59:59' }
        default: return { min: '00:00:00', max: '23:59:59' }
      }
    }
    
    const calendarOptions = computed(() => {
      const timeRange = getTimeSlotRange(props.timeSlot)
      return {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'zh-cn',
        buttonText: {
          today: '今天',
          month: '月',
          week: '周',
          day: '日'
        },
        allDaySlot: false,
        slotMinTime: timeRange.min,
        slotMaxTime: timeRange.max,
        slotDuration: '00:30:00',
        height: 'auto',
        editable: false,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        events: events.value,
        select: handleDateSelect,
        eventClick: handleEventClick,
        datesSet: handleDatesSet
      }
    })

    const refetchEvents = () => {
      const calendarApi = calendarRef.value?.getApi()
      if (calendarApi) {
        const start = calendarApi.view.activeStart
        const end = calendarApi.view.activeEnd
        fetchEvents(formatDateForApi(start), formatDateForApi(end))
      }
    }

    return {
      calendarRef,
      calendarOptions,
      refetchEvents
    }
  }
}
</script>

<style scoped>
.reservation-calendar {
  width: 100%;
  padding: 10px;
}

.reservation-calendar :deep(.fc) {
  font-family: inherit;
}

.reservation-calendar :deep(.fc-toolbar-title) {
  font-size: 1.2em;
}

.reservation-calendar :deep(.fc-button) {
  background-color: #409EFF;
  border-color: #409EFF;
}

.reservation-calendar :deep(.fc-button:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.reservation-calendar :deep(.fc-button-primary:not(:disabled).fc-button-active) {
  background-color: #337ecc;
  border-color: #337ecc;
}

.reservation-calendar :deep(.fc-event) {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
}

.reservation-calendar :deep(.fc-daygrid-event) {
  font-size: 12px;
}

.reservation-calendar :deep(.fc-timegrid-event) {
  font-size: 12px;
}

.reservation-calendar :deep(.fc-col-header-cell) {
  background-color: #f5f7fa;
}

.reservation-calendar :deep(.fc-timegrid-slot) {
  height: 40px;
}
</style>
