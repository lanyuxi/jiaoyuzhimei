import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import GeometryShapesExperiment from './GeometryShapesExperiment'

vi.mock('../../components/NarrationPresenter', () => ({
  NarrationPresenter: () => null,
}))

describe('GeometryShapesExperiment', () => {
  it('shows independent narration and animation controls in the page header', () => {
    const html = renderToString(<GeometryShapesExperiment />)

    expect(html).toContain('开始讲解')
    expect(html).toContain('播放动画')
  })
})
