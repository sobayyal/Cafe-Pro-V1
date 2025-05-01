import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

const cafeSettingsSchema = z.object({
  cafeName: z.string().min(1, "Cafe name is required"),
  cafeAddress: z.string().optional(),
  cafePhone: z.string().optional(),
  receiptHeader: z.string().min(1, "Receipt header is required"),
  receiptFooter: z.string().min(1, "Receipt footer is required"),
  taxRate: z.coerce.number().min(0).max(1, "Tax rate must be between 0 and 1 (e.g., 0.10 for 10%)"),
  logoUrl: z.string().optional(),
});

type CafeSettings = z.infer<typeof cafeSettingsSchema>;

export default function CafeSettingsForm() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/cafe-settings'],
    queryFn: async () => {
      const response = await fetch('/api/cafe-settings');
      if (!response.ok) throw new Error('Failed to fetch cafe settings');
      return await response.json();
    },
  });

  const form = useForm<CafeSettings>({
    resolver: zodResolver(cafeSettingsSchema),
    defaultValues: {
      cafeName: "",
      cafeAddress: "",
      cafePhone: "",
      receiptHeader: "",
      receiptFooter: "",
      taxRate: 0.10,
      logoUrl: "",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        cafeName: settings.cafeName || "",
        cafeAddress: settings.cafeAddress || "",
        cafePhone: settings.cafePhone || "",
        receiptHeader: settings.receiptHeader || "",
        receiptFooter: settings.receiptFooter || "",
        taxRate: settings.taxRate || 0.10,
        logoUrl: settings.logoUrl || "",
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: CafeSettings) => {
      return await apiRequest('/api/cafe-settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Receipt customization has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cafe-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: CafeSettings) {
    updateSettingsMutation.mutate(data);
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Receipt Customization</CardTitle>
          <CardDescription>
            Customize the information that appears on receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cafeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cafe Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter cafe name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will appear at the top of the receipt
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cafeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cafe Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter cafe address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cafePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cafe Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter cafe phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          max="1" 
                          placeholder="0.10" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter as decimal (e.g., 0.10 for 10%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter logo URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        Link to your cafe logo (recommended size: 200x100px)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="receiptHeader"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Header</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a welcome message for the top of the receipt"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      A message that appears at the top of every receipt
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiptFooter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Footer</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a thank you message for the bottom of the receipt"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      A message that appears at the bottom of every receipt
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPreviewOpen(true)}
                >
                  Preview Receipt
                </Button>
                <Button 
                  type="submit"
                  disabled={updateSettingsMutation.isPending || !form.formState.isDirty}
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPreviewOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Receipt Preview</CardTitle>
            <CardDescription>
              This is how your receipt will look
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-6 border rounded-md shadow-sm font-mono text-sm">
              <div className="text-center mb-4">
                {form.watch("logoUrl") && (
                  <div className="mb-2">
                    <img 
                      src={form.watch("logoUrl")} 
                      alt="Cafe Logo" 
                      className="max-h-[100px] mx-auto"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
                <div className="font-bold text-lg">{form.watch("cafeName")}</div>
                {form.watch("cafeAddress") && (
                  <div>{form.watch("cafeAddress")}</div>
                )}
                {form.watch("cafePhone") && (
                  <div>Tel: {form.watch("cafePhone")}</div>
                )}
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-2 my-4 text-center">
                {form.watch("receiptHeader")}
              </div>

              <div className="mb-4">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order #:</span>
                  <span>SAMPLE-1234</span>
                </div>
                <div className="flex justify-between">
                  <span>Server:</span>
                  <span>Sample Server</span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-2 mb-4">
                <div className="flex justify-between font-bold">
                  <span>Item</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Cappuccino x2</span>
                  <span>PKR 900</span>
                </div>
                <div className="flex justify-between">
                  <span>Cheesecake x1</span>
                  <span>PKR 675</span>
                </div>
                <div className="flex justify-between">
                  <span>Latte x1</span>
                  <span>PKR 425</span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>PKR 2,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({(form.watch("taxRate") * 100).toFixed(0)}%):</span>
                  <span>PKR {(2000 * form.watch("taxRate")).toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>PKR {(2000 * (1 + form.watch("taxRate"))).toFixed(0)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 mt-4 pt-4 text-center">
                {form.watch("receiptFooter")}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsPreviewOpen(false)}
              >
                Close Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}