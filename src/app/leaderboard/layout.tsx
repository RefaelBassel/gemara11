import Navbar from "@/components/Navbar";
import CountdownBanner from "@/components/CountdownBanner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <CountdownBanner />
      {children}
    </>
  );
}
