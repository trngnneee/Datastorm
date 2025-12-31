import { MainMap } from "./components/MainMap";
import { NetSales } from "./components/Chart/NetSales"

export default function MapPage() {
  return (
    <>
      <div className="ml-[20vw] w-[80vw] h-screen flex flex-col overflow-y-auto">
        <div className="h-16 text-[36px] font-bold border-b flex items-center justify-center shrink-0">
          Map Visualization
        </div>

        <div className="relative h-[70vh] shrink-0">
          <MainMap />
        </div>

        <div className="px-6 py-5">
          <div className="h-16 text-[28px] font-bold flex items-center justify-center mb-4">
            Chart Analysis
          </div>

          <div className="h-100">
            <NetSales />
          </div>
        </div>
      </div>
    </>
  );
}