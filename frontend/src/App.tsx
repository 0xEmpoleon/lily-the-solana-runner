import GameScene from './components/Game/GameScene';

function App() {
  return (
    <div className="w-full h-[100dvh] bg-slate-900 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
       {/* Mobile Phone Container */}
       <div className="w-full h-full max-w-[428px] max-h-[926px] bg-black relative rounded-none sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-0 sm:border-8 border-slate-800">
         <GameScene />
       </div>
    </div>
  );
}

export default App;
