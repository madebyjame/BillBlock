import { useReducer } from 'react'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import { blocksReducer, initialBlocks } from './store/blocksReducer'
import { useExportPdf } from './hooks/useExportPdf'

export default function App() {
  const [blocks, dispatch] = useReducer(blocksReducer, initialBlocks)
  const { canvasRef, exportPdf, isExporting } = useExportPdf()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar
        onAddBlock={type => dispatch({ type: 'ADD_BLOCK', blockType: type })}
        onExportPdf={() => exportPdf('bill-block-document.pdf')}
        isExporting={isExporting}
      />
      <Canvas blocks={blocks} dispatch={dispatch} canvasRef={canvasRef} />
    </div>
  )
}
