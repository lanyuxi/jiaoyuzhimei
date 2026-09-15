import { describe, expect, it } from 'vitest'
import { isImmersiveLabRoute } from './Layout'
describe('沉浸式实验室路由判定', () => {
  it('教材实验详情页是全屏沉浸式的', () => {
    expect(isImmersiveLabRoute('/physics/labs/ammeter-use')).toBe(true)
    expect(isImmersiveLabRoute('/physics/labs/heat-capacity-comparison')).toBe(true)
  })
  it('列表页与其它页面正常显示导航栏', () => {
    expect(isImmersiveLabRoute('/physics')).toBe(false)
    expect(isImmersiveLabRoute('/physics/sessions')).toBe(false)
    expect(isImmersiveLabRoute('/physics/labs')).toBe(false)
    expect(isImmersiveLabRoute('/chemistry/acid-base')).toBe(false)
    expect(isImmersiveLabRoute('/')).toBe(false)
  })
})
