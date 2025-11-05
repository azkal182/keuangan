import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { AllocationSettings } from "@/components/AllocationSettings";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { AllocationProgress } from "@/components/AllocationProgress";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  user_id: string;
  created_at: string | null;
}

interface Allocation {
  id: string;
  category: string;
  percentage: number;
}

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [userName, setUserName] = useState("");

  const loadTransactions = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat transaksi",
        variant: "destructive",
      });
    } else {
      setTransactions(data || []);
    }
  }, [toast]);

  const loadAllocations = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("allocations")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat alokasi",
        variant: "destructive",
      });
    } else {
      setAllocations(data || []);
    }
  }, [toast]);

  useEffect(() => {
    loadUserData();
    loadTransactions();
    loadAllocations();
  }, [loadTransactions, loadAllocations]);

  const loadUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name || "");
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Calculate monthly totals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const date = new Date(t.transaction_date);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  const totalIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate spending by category
  const spendingByCategory = allocations.map((allocation) => {
    const spent = monthlyTransactions
      .filter((t) => t.type === "expense" && t.category === allocation.category)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allocated = (totalIncome * allocation.percentage) / 100;
    const remaining = allocated - spent;
    const percentageUsed = allocated > 0 ? (spent / allocated) * 100 : 0;

    return {
      ...allocation,
      spent,
      allocated,
      remaining,
      percentageUsed,
      isOverBudget: spent > allocated,
    };
  });

  const hasOverBudget = spendingByCategory.some((cat) => cat.isOverBudget);

  return (
    <div className="min-h-screen bg-linear-to-br from-secondary via-background to-muted">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Dashboard Keuangan
            </h1>
            {userName && (
              <p className="text-muted-foreground mt-1">
                Selamat datang, {userName}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>

        {/* Warning Alert */}
        {hasOverBudget && (
          <Card className="mb-6 border-warning bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-warning" />
                <div>
                  <h3 className="font-semibold text-warning-foreground">
                    Peringatan!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Anda telah melebihi alokasi budget pada beberapa kategori.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pemasukan
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground">
                Rp {totalIncome.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengeluaran
              </CardTitle>
              <TrendingDown className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground">
                Rp {totalExpense.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo
              </CardTitle>
              <Wallet className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground">
                Rp {(totalIncome - totalExpense).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tersisa</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <TransactionForm
              onTransactionAdded={loadTransactions}
              allocations={allocations}
            />
            <AllocationProgress spendingByCategory={spendingByCategory} />
            <TransactionList
              transactions={monthlyTransactions}
              onUpdate={loadTransactions}
            />
          </div>

          {/* Right Column */}
          <div>
            <AllocationSettings
              onAllocationsUpdated={loadAllocations}
              allocations={allocations}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
