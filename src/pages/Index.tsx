const PlaceholderIndex = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#fcfbf8]">
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <img src="/placeholder.svg" alt="" width={120} height={72} className="opacity-70" />
      <p className="text-muted-foreground text-sm">Home — customize this view.</p>
    </div>
  </div>
);

const Index = PlaceholderIndex;

export default Index;
