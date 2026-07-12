import { useSearchParams } from 'react-router-dom'
import { parsePhysicsCatalogMode, serializePhysicsCatalogMode } from './catalogState'
import LegacyPhysicsCatalog from './LegacyPhysicsCatalog'
import TextbookPhysicsCatalog from './TextbookPhysicsCatalog'

export default function PhysicsHome() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCatalog = parsePhysicsCatalogMode(searchParams)

  function selectCatalog(next: typeof activeCatalog) {
    setSearchParams(serializePhysicsCatalogMode(next))
  }

  return (
    <div className="space-y-6">
      <section className="border-b border-[#ece8df] pb-5">
        <h1 className="text-3xl font-bold text-[#242424]">物理之美</h1>
        <div className="mt-5 flex gap-6" role="tablist" aria-label="物理实验目录">
          <button type="button" role="tab" aria-selected={activeCatalog === 'textbook'} onClick={() => selectCatalog('textbook')} className={`border-b-2 pb-2 text-sm font-semibold ${activeCatalog === 'textbook' ? 'border-[#165DFF] text-[#165DFF]' : 'border-transparent text-[#6f6a62]'}`}>教材实验</button>
          <button type="button" role="tab" aria-selected={activeCatalog === 'extended'} onClick={() => selectCatalog('extended')} className={`border-b-2 pb-2 text-sm font-semibold ${activeCatalog === 'extended' ? 'border-[#165DFF] text-[#165DFF]' : 'border-transparent text-[#6f6a62]'}`}>拓展实验</button>
        </div>
      </section>
      <div role="tabpanel">{activeCatalog === 'textbook' ? <TextbookPhysicsCatalog /> : <LegacyPhysicsCatalog />}</div>
    </div>
  )
}
