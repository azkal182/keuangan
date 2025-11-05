import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { AllocationSettings } from "@/components/AllocationSettings";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { AllocationProgress } from "@/components/AllocationProgress";
import { Navbar } from "@/components/Navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  // Filter bulan/tahun
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
    loadTransactions();
    loadAllocations();
  }, [loadTransactions, loadAllocations]);


  // Navigasi bulan
  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleGoToCurrentMonth = () => {
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  // Calculate monthly totals
  const monthlyTransactions = transactions.filter((t) => {
    const date = new Date(t.transaction_date);
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  // Calculate cumulative balance (saldo akumulatif)
  // Transaksi dari awal sampai akhir bulan terpilih
  const cumulativeTransactions = transactions.filter((t) => {
    const date = new Date(t.transaction_date);
    const transactionDate = new Date(selectedYear, selectedMonth + 1, 0); // Last day of selected month
    return new Date(t.transaction_date) <= transactionDate;
  });

  const cumulativeIncome = cumulativeTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const cumulativeExpense = cumulativeTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const cumulativeBalance = cumulativeIncome - cumulativeExpense;

  // Calculate starting balance (saldo awal bulan)
  // Transaksi sampai akhir bulan sebelumnya
  const previousMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.transaction_date);
    const lastDayOfPreviousMonth = new Date(selectedYear, selectedMonth, 0); // Last day of previous month
    return date <= lastDayOfPreviousMonth;
  });

  const startingBalance =
    previousMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0) -
    previousMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

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

  // Nama bulan
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const isCurrentMonth =
    selectedMonth === new Date().getMonth() &&
    selectedYear === new Date().getFullYear();

  // Generate tahun options (dari tahun pertama transaksi sampai tahun sekarang + 1)
  const years = [];
  if (transactions.length > 0) {
    // Transaksi diurutkan descending, jadi yang terakhir adalah yang paling lama
    const firstYear = new Date(
      transactions[transactions.length - 1].transaction_date
    ).getFullYear();
    const currentYear = new Date().getFullYear();
    for (let year = Math.min(firstYear, currentYear); year <= currentYear + 1; year++) {
      years.push(year);
    }
  } else {
    const currentYear = new Date().getFullYear();
    years.push(currentYear);
    years.push(currentYear + 1);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-secondary via-background to-muted">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Dashboard Keuangan
          </h1>
          <p className="text-muted-foreground">
            Kelola keuangan Anda dengan mudah dan efisien
          </p>
        </div>

        {/* Filter Periode - Enhanced Design */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">Pilih Periode</h3>
                  <p className="text-xs text-muted-foreground sm:hidden">
                    Pilih bulan dan tahun yang ingin dilihat
                  </p>
                </div>
              </div>
              {!isCurrentMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToCurrentMonth}
                  className="w-full sm:w-auto shrink-0"
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  Bulan Ini
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4">
              {/* Month Selector */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousMonth}
                  className="h-10 w-10 shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Month and Year Selectors */}
                <div className="flex flex-1 items-center gap-2">
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="flex-1 h-10 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px] sm:w-[120px] h-10 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-10 w-10 shrink-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Info Text */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Menampilkan data untuk{" "}
                  <span className="font-semibold text-foreground">
                    {monthNames[selectedMonth]} {selectedYear}
                  </span>
                </p>
                {isCurrentMonth && (
                  <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium w-fit">
                    Bulan Aktif
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Awal
              </CardTitle>
              <Wallet className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground">
                Rp {startingBalance.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awal {monthNames[selectedMonth]}
              </p>
            </CardContent>
          </Card>

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
              <p className="text-xs text-muted-foreground mt-1">
                {monthNames[selectedMonth]} {selectedYear}
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {monthNames[selectedMonth]} {selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Akumulatif
              </CardTitle>
              <Wallet className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl md:text-3xl font-bold ${
                  cumulativeBalance >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                Rp {cumulativeBalance.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sampai akhir {monthNames[selectedMonth]}
              </p>
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
