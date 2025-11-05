import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-muted">
      <div className="text-center space-y-6 p-8">
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
          <Wallet className="w-10 h-10 text-primary-foreground" />
        </div>
        <div>
          <h1 className="mb-4 text-5xl font-bold text-foreground">
            Keuangan Pribadi
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Kelola penghasilan dan alokasi keuangan Anda dengan mudah dan bijak
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => navigate("/auth")}
          className="shadow-lg"
        >
          Mulai Sekarang
        </Button>
      </div>
    </div>
  );
};

export default Index;
