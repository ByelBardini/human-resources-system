function Background() {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950 to-blue-950" />
      <div className="absolute top-1/4 left-[15%] w-[300px] h-[300px] bg-indigo-950/40 rounded-full blur-3xl" />
      <div className="absolute top-[70%] left-[10%] w-[250px] h-[250px] bg-cyan-900/30 rounded-full blur-3xl" />
      <div className="absolute top-[20%] right-[20%] w-[280px] h-[280px] bg-teal-900/25 rounded-full blur-3xl" />
      <div className="absolute bottom-[15%] right-[10%] w-[320px] h-[320px] bg-red-950/20 rounded-full blur-3xl" />
      <div className="absolute top-[50%] left-[45%] w-[200px] h-[200px] bg-amber-900/20 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]" />
    </div>
  );
}

export default Background;
