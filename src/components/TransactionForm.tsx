import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";

interface Allocation {
  id: string;
  category: string;
  percentage: number;
}

interface TransactionFormProps {
  onTransactionAdded: () => void;
  allocations: Allocation[];
}

export const TransactionForm = ({
  onTransactionAdded,
  allocations,
}: TransactionFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || !date) {
      toast({
        title: "Error",
        description: "Mohon isi semua field yang wajib",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type,
      category,
      amount: parseFloat(amount),
      description,
      transaction_date: date,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil ditambahkan",
      });
      setCategory("");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      onTransactionAdded();
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Tambah Transaksi</CardTitle>
        <CardDescription>Catat pemasukan atau pengeluaran Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Baris 1: Jenis & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <Label htmlFor="type">Jenis</Label>
              <Select
                value={type}
                onValueChange={(value: "income" | "expense") => setType(value)}
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="category">Kategori</Label>
              {type === "expense" && allocations.length > 0 ? (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {allocations.map((allocation) => (
                      <SelectItem
                        key={allocation.id}
                        value={allocation.category}
                      >
                        {allocation.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="category"
                  className="w-full"
                  placeholder="Contoh: Gaji, Freelance"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Baris 2: Jumlah & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                className="w-full"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                className="w-full"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Baris 3: Keterangan */}
          <div className="space-y-2">
            <Label htmlFor="description">Keterangan (Opsional)</Label>
            <Textarea
              id="description"
              className="w-full"
              placeholder="Tambahkan catatan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <PlusCircle className="w-4 h-4 mr-2" />
            {loading ? "Memproses..." : "Tambah Transaksi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
