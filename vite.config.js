export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true
  },
  build: {
    outDir: 'dist'
  }
});
