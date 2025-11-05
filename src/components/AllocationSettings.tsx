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
import { Plus, Trash2 } from "lucide-react";

interface Allocation {
  id: string;
  category: string;
  percentage: number;
}

interface AllocationSettingsProps {
  onAllocationsUpdated: () => void;
  allocations: Allocation[];
}

export const AllocationSettings = ({
  onAllocationsUpdated,
  allocations,
}: AllocationSettingsProps) => {
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState("");
  const [newPercentage, setNewPercentage] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPercentage = allocations.reduce(
    (sum, a) => sum + Number(a.percentage),
    0
  );

  const handleAddAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || !newPercentage) {
      toast({
        title: "Error",
        description: "Mohon isi semua field",
        variant: "destructive",
      });
      return;
    }

    const percentage = parseFloat(newPercentage);
    if (percentage <= 0 || percentage > 100) {
      toast({
        title: "Error",
        description: "Persentase harus antara 0-100",
        variant: "destructive",
      });
      return;
    }

    if (totalPercentage + percentage > 100) {
      toast({
        title: "Error",
        description: `Total persentase akan melebihi 100% (saat ini: ${totalPercentage}%)`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("allocations").insert({
      user_id: user.id,
      category: newCategory,
      percentage: percentage,
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
        description: "Alokasi berhasil ditambahkan",
      });
      setNewCategory("");
      setNewPercentage("");
      onAllocationsUpdated();
    }
  };

  const handleDeleteAllocation = async (id: string) => {
    const { error } = await supabase.from("allocations").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus alokasi",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Alokasi berhasil dihapus",
      });
      onAllocationsUpdated();
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Pengaturan Alokasi</CardTitle>
        <CardDescription>
          Atur alokasi budget Anda (Total: {totalPercentage}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAddAllocation} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              placeholder="Contoh: Nabung, Sodaqoh"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="percentage">Persentase (%)</Label>
            <Input
              id="percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="10"
              value={newPercentage}
              onChange={(e) => setNewPercentage(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Alokasi
          </Button>
        </form>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">
            Alokasi Saat Ini
          </h4>
          {allocations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada alokasi
            </p>
          ) : (
            <div className="space-y-2">
              {allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {allocation.category}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {allocation.percentage}%
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAllocation(allocation.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPercentage < 100 && allocations.length > 0 && (
          <p className="text-sm text-warning bg-warning/10 p-3 rounded-lg">
            ⚠️ Total alokasi belum mencapai 100%. Sisa:{" "}
            {(100 - totalPercentage).toFixed(2)}%
          </p>
        )}
      </CardContent>
    </Card>
  );
};
