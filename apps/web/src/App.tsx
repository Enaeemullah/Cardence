import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
        <h1>Cardence</h1>
        <p>Card Lifecycle Management System</p>
      </div>
    </QueryClientProvider>
  );
}

export default App;
