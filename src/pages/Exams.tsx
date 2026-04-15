import AppLayout from "@/components/AppLayout";
import SectionExams from "@/components/sidebar/SectionExams";

const Exams = () => {
  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Exames & Protocolo</h1>
        <SectionExams />
      </div>
    </AppLayout>
  );
};

export default Exams;
