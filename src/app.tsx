import { Suspense, Show, type ParentComponent } from 'solid-js';
import { store } from './store/data';
import BottomNav from './components/BottomNav';
import DesktopNav from './components/DesktopNav';

const App: ParentComponent = (props) => {
  return (
    <div class="min-h-screen bg-gray-50">
      <DesktopNav />

      <main class="pb-20 md:pb-8 pt-14 md:pt-16">
        <Suspense fallback={
          <div class="flex justify-center py-16">
            <div class="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        }>
          <Show when={!store.loading()} fallback={
            <div class="flex justify-center py-16">
              <div class="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
          }>
            {props.children}
          </Show>
        </Suspense>
      </main>

      <BottomNav />
    </div>
  );
};

export default App;
