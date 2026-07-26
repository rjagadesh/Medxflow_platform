import calendar
from collections import defaultdict
from datetime import datetime, timedelta, date
import os
import shutil
import time
from rest_framework import generics, permissions
from openpyxl.utils import get_column_letter
import pdfkit
from dateutil.parser import parse
from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Count, F
from django.http import FileResponse, HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views import View
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Client, ClientChangeLog 
from agentsapp.models import AgentTask
from .models import Billing, PaymentMethod
from .serializers import AgentTaskSerializer, BillingSerializer, PaymentMethodSerializer, ClientUsernameSerializer
from django_filters.rest_framework import DjangoFilterBackend
from io import BytesIO
from xhtml2pdf import pisa
import requests


from rest_framework import generics
from accounts.models import User
from modules.models import GeneratedAPI
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment
import os
 
class ClientListAPIView(APIView):

    def get(self, request):
        # Fetch data using ORM (efficient with values_list)
        clients = Client.objects.all().values_list('client_name', 'license_tier')

        # Create workbook in memory
        wb = Workbook()
        ws = wb.active
        ws.title = "Clients"

        # Header styling
        header_fill = PatternFill(
            start_color="DDEBF7",   # Light blue (same as Excel's default table header)
            end_color="DDEBF7",
            fill_type="solid"
        )

        header_font = Font(
            bold=True,
            color="1F4E79",        # Dark blue text – perfect contrast
        )

        header_align = Alignment(
            horizontal="center",
            vertical="center"
        )

        # Add header
        headers = ["Client Name", "License Tier"]
        ws.append(headers)
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_align

        # Add data rows
        for client_name, license_tier in clients:
            ws.append([client_name, license_tier or "N/A"])  # Handle None values

        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                cell_value = str(cell.value) if cell.value is not None else ""
                if len(cell_value) > max_length:
                    max_length = len(cell_value)
            adjusted_width = min(max_length + 2, 60)  # Cap width to avoid huge columns
            ws.column_dimensions[column_letter].width = adjusted_width

        # Save to BytesIO (in memory)
        excel_buffer = BytesIO()
        wb.save(excel_buffer)
        excel_buffer.seek(0)

        # Return file for direct download
        response = FileResponse(
            excel_buffer,
            as_attachment=True,
            filename="clients.xlsx",
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="clients.xlsx"'

        return response


class UserWithApiKeyListAPIView(APIView):
    def get(self, request):
        # Main ORM query: Group by App → API Key → User → Count tasks
        task_stats = AgentTask.objects.select_related(
            'apikey', 'user'
        ).values(
            app_name=F('apikey__app_name'),                    # or 'apikey__app_name' if field is different
            api_key=F('apikey__api_key'),                  # the actual API key string
            username=F('user__username'),
        ).annotate(
            task_count=Count('id')
        ).order_by('app_name', 'api_key', 'username')

        # Convert to list for counting & reuse
        stats = list(task_stats)
        total_records = len(stats)
        total_tasks = sum(row['task_count'] for row in stats)

        # Create Excel workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Agent Task Stats"

        # === Summary Section ===
        ws.append(["Agent Task Distribution Report"])
        ws.append([f"Total Unique API Key + User Combinations: {total_records}"])
        ws.append([f"Total Agent Tasks Processed: {total_tasks}"])
        ws.append([f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"])
        ws.append([])  # spacer

        # Style summary
        title_font = Font(size=14, bold=True, color="1F4E79")
        summary_fill = PatternFill(start_color="E6F0FA", end_color="E6F0FA", fill_type="solid")
        ws["A1"].font = title_font
        ws["A2"].fill = summary_fill
        ws["A2"].font = Font(bold=True, color="1F4E79")
        ws["A3"].fill = summary_fill
        ws["A3"].font = Font(bold=True, color="1F4E79")

        # === Header Row (Light Blue) ===
        header_fill = PatternFill(start_color="DDEBF7", end_color="DDEBF7", fill_type="solid")
        header_font = Font(bold=True, color="1F4E79")
        header_align = Alignment(horizontal="center", vertical="center")

        headers = ["Username", "App Name", "Task Count"] #"API Key"
        ws.append(headers)
        for cell in ws[6]:  # Row 6 = header
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_align

        # === Data Rows ===
        for row in stats:
            ws.append([
                row['username'],
                row['app_name'] or "Unknown App",
                # row['api_key'],
                row['task_count']
            ])

        # === Auto-fit columns ===
        for i, col in enumerate(ws.columns, 1):
            max_length = 0
            column_letter = get_column_letter(i)
            for cell in col:
                value = str(cell.value) if cell.value is not None else ""
                if len(value) > max_length:
                    max_length = len(value)
            adjusted_width = min(max_length + 3, 60)
            ws.column_dimensions[column_letter].width = adjusted_width

        # === Save to memory & force download ===
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        filename = f"agent_tasks_by_apikey_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"
        response = FileResponse(
            buffer,
            as_attachment=True,
            filename=filename,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response
 

class BillingViewSet(viewsets.ModelViewSet):
    queryset = Billing.objects.all()
    serializer_class = BillingSerializer


class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer


def htmltopdf(html_content):
    """Generate PDF from HTML content using pisa (xhtml2pdf) - return as binary data"""
    print("Generating PDF from HTML content...")

    try:
        # Create PDF in memory
        result = BytesIO()
        pdf = pisa.CreatePDF(BytesIO(html_content.encode("UTF-8")), dest=result)

        if not pdf.err:
            print("PDF generated successfully in memory")
            result.seek(0)
            return result.getvalue()
        else:
            print(f"Error generating PDF: {pdf.err}")
            return None

    except Exception as e:
        print(f"Error generating PDF: {e}")
        return None

from modules.models import Agent_API_SecretKeyss
from middleware.models import ClientApiUsage
from django.db.models import Sum
import base64
class GenerateInvoiceView(APIView):
    """Generate invoice PDF for authenticated user's client or specified client_id for selected month"""

    permission_classes = [IsAuthenticated]

    def get_client(self, request):
        """
        Get client based on client_id parameter or authenticated user's client.
        Returns client object or None with error message.
        """
        client_id = request.GET.get("client_id")
        
        if client_id:
            try:
                client = Client.objects.get(client_id=client_id)
                print(f"Fetched client by ID {client_id}: {client.client_name}")
                return client, None
            except Client.DoesNotExist:
                return None, "Client not found"
        else:
            try:
                client = request.user.client
                if client is None:
                    return None, "User does not have an associated client"
                return client, None
            except AttributeError:
                return None, "User does not have an associated client"

    def get_slab_config_period(self, period):
        """
        Get slab configuration for a specific period using the period's additional_cost.
        """
        print(f"Getting slab config for period {period['start_date']} to {period['end_date']}")
        print(f"Period additional_cost: {period.get('additional_cost')}")
        
        # Check if period has additional_cost
        if period.get('additional_cost') and isinstance(period['additional_cost'], dict):
            additional_cost = period['additional_cost']
            print(f"Processing period additional_cost: {additional_cost}")
            
            if any(key in additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                converted_config = self.convert_discount_to_tier_config(additional_cost)
                print(f"✅ Using period-specific slab config: {converted_config}")
                return converted_config
            else:
                print("❌ Period has additional_cost but no discount keys found")
        else:
            print("❌ Period has no additional_cost or it's not a dict")
        
        # Fallback to current client's additional_cost
        client = period.get('client')
        if client and hasattr(client, 'additional_cost') and client.additional_cost and isinstance(client.additional_cost, dict):
            additional_cost = client.additional_cost
            print(f"Processing client additional_cost: {additional_cost}")
            
            if any(key in additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                converted_config = self.convert_discount_to_tier_config(additional_cost)
                print(f"🔄 Using client slab config as fallback: {converted_config}")
                return converted_config
        
        print("🚨 No slab config found for period, using defaults")
        return None

    def convert_discount_to_tier_config(self, discount_config):
        """
        Convert discount-based configuration to tier-based configuration.
        """
        print(f"🔄 Converting discount config: {discount_config}")
        
        tier_config = {}
        
        try:
            # Handle discount1_from (this becomes tier1 - the threshold)
            if 'discount1_from' in discount_config:
                discount1_from = discount_config['discount1_from']
                print(f"📥 Processing discount1_from: {discount1_from} (type: {type(discount1_from)})")
                
                if discount1_from is not None:
                    try:
                        tier1_value = float(discount1_from)
                        tier_config['tier1'] = tier1_value
                        print(f"✅ Set tier1: {tier1_value}")
                    except (TypeError, ValueError) as e:
                        print(f"❌ Error converting discount1_from: {e}")
            
            # Handle discount_1 (this becomes rate1)
            if 'discount_1' in discount_config:
                discount_1 = discount_config['discount_1']
                print(f"📥 Processing discount_1: {discount_1} (type: {type(discount_1)})")
                
                if discount_1 is not None:
                    try:
                        rate1_value = float(discount_1)
                        tier_config['rate1'] = rate1_value
                        print(f"✅ Set rate1: {rate1_value}")
                    except (TypeError, ValueError) as e:
                        print(f"❌ Error converting discount_1: {e}")
            
            # For single-tier pricing, set tier2 = tier1 and rate2 = rate1
            if 'tier1' in tier_config and 'rate1' in tier_config:
                tier_config['tier2'] = tier_config['tier1']
                tier_config['rate2'] = tier_config['rate1']
                print(f"🔄 Set tier2 and rate2 to match tier1 and rate1")
            
            print(f"🎯 Final converted tier config: {tier_config}")
            
        except Exception as e:
            print(f"💥 Unexpected error in convert_discount_to_tier_config: {e}")
            import traceback
            traceback.print_exc()
            return None
            
        return tier_config if tier_config else None

    def build_tier_config(self, license_tier, slab_config):
        """
        Build tier configuration based on license tier and slab config.
        """
        default_config = self.get_default_tier_config(license_tier)
        
        if not slab_config:
            print(f"Using default config for {license_tier}: {default_config}")
            return default_config
        
        try:
            merged_config = default_config.copy()
            
            # Only override defaults with values that exist in slab_config
            for key in ['tier1', 'tier2', 'rate1', 'rate2', 'rate']:
                if key in slab_config and slab_config[key] is not None:
                    try:
                        merged_config[key] = float(slab_config[key])
                        print(f"✅ Overriding {key} with custom value: {slab_config[key]}")
                    except (TypeError, ValueError):
                        print(f"❌ Invalid {key} value in slab_config, using default: {slab_config[key]}")
            
            print(f"Final merged config for {license_tier}: {merged_config}")
            return merged_config
            
        except Exception as e:
            print(f"❌ Error merging tier config: {e}")
            return default_config

    def get_default_tier_config(self, license_tier):
        """Get the default tier configuration for each license tier."""
        if license_tier == 'lite':
            return {'rate': 0.01}
        elif license_tier == 'standard':
            return {
                'tier1': 25000.0,
                'tier2': 25000.0,
                'rate1': 0.07,
                'rate2': 0.07
            }
        elif license_tier == 'pro':
            return {
                'tier1': 70000.0,
                'tier2': 70000.0,
                'rate1': 0.07,
                'rate2': 0.07
            }
        elif license_tier == 'enterprise':
            return {
                'tier1': 200000.0,
                'tier2': 200000.0,
                'rate1': 0.07,
                'rate2': 0.07
            }
        else:
            return {
                'tier1': 0.0,
                'tier2': 0.0,
                'rate1': 0.0,
                'rate2': 0.0
            }

    def get_api_usage_count(self, client, start_date, end_date):
        """
        Fetch API usage count from ClientApiUsage table for the given client and date range.
        """
        try:
            # Get all API keys associated with this client's users
            user_api_keys = Agent_API_SecretKeyss.objects.filter(
                user__client=client
            ).values_list('api_key', flat=True)
            
            # Sum the count from ClientApiUsage for these API keys in the date range
            api_usage = ClientApiUsage.objects.filter(
                apikey__api_key__in=user_api_keys,
                date__gte=start_date,
                date__lte=end_date
            ).aggregate(total_count=Sum('count'))
            
            total_api_calls = api_usage['total_count'] or 0
            print(f"Total API calls from DB for client {client.client_name}: {total_api_calls}")
            
            return total_api_calls
            
        except Exception as e:
            print(f"Error fetching API usage from DB: {e}")
            return 0

    def get_tier_periods_for_month(self, client, month_start, month_end):
        """
        Get all tier periods that were active during the selected month
        Respect effective_date from ClientChangeLog for each period.
        """
        # Get change logs that overlap with the selected month
        change_logs = ClientChangeLog.objects.filter(
            client=client,
            effective_from__lte=month_end,
        ).exclude(
            effective_to__lt=month_start
        ).order_by('effective_from')
        
        print(f"🔍 DEBUG: Checking ClientChangeLog for client {client.client_name}")
        print(f"🔍 DEBUG: Found {change_logs.count()} change logs")
        
        # Debug the first log
        if change_logs.exists():
            first_log = change_logs.first()
            print(f"🔍 DEBUG First log details:")
            print(f"  - client_vm_count from log: {first_log.client_vm_count}")
            print(f"  - client_vm_cost from log: {first_log.client_vm_cost}")
            print(f"  - vm_count from log: {first_log.vm_count}")
            print(f"  - effective_from: {first_log.effective_from}")
            print(f"  - effective_to: {first_log.effective_to}")
        
        # Also check current client values
        print(f"🔍 DEBUG Current client values:")
        print(f"  - client.client_vm_count: {client.client_vm_count}")
        print(f"  - client.client_vm_cost: {client.client_vm_cost}")
        print(f"  - client.vm_count: {client.vm_count}")
        
        periods = []
        total_days_in_month = (month_end - month_start).days + 1
        
        previous_end = month_start - timedelta(days=1)  # Start from day before month starts
        
        for log in change_logs:
            # Use effective_date from change log if available, otherwise use effective_from
            period_effective_date = None
            if log.effective_date:
                period_effective_date = log.effective_date.date()
                print(f"Using effective_date from change log: {period_effective_date}")
            elif log.effective_from:
                period_effective_date = log.effective_from.date()
                print(f"Using effective_from as effective_date: {period_effective_date}")
            else:
                # If no effective_date in log, use log's effective_from date
                period_effective_date = log.effective_from.date() if log.effective_from else month_start
                print(f"Using effective_from date as fallback: {period_effective_date}")
            
            # Adjust period start based on effective_date
            if period_effective_date:
                period_start = max(month_start, period_effective_date)
                print(f"Adjusted period_start considering effective_date: {period_start}")
            else:
                period_start = month_start
            
            # Avoid overlap with previous period
            if previous_end >= period_start:
                period_start = previous_end + timedelta(days=1)
            
            period_end = min(month_end, log.effective_to.date()) if log.effective_to else month_end
            
            # Only include periods that have at least one day
            if period_start <= period_end:
                # Get the correct tier cost for this period
                tier_cost = self.get_tier_cost_for_period(log, client)
                
                # Get machine counts AND client_vm_cost from change log
                dev_count = log.dev_count if log.dev_count is not None else client.dev_count
                prod_count = log.prod_count if log.prod_count is not None else client.prod_count
                vm_count = log.vm_count if log.vm_count is not None else client.vm_count
                client_vm_count = log.client_vm_count if log.client_vm_count is not None else client.client_vm_count
                
                # ✅ Get client_vm_cost from change log
                client_vm_cost = log.client_vm_cost if log.client_vm_cost is not None else client.client_vm_cost
                
                print(f"🔍 DEBUG Period {len(periods)+1} values from log:")
                print(f"  - dev_count: {dev_count} (log: {log.dev_count}, client: {client.dev_count})")
                print(f"  - prod_count: {prod_count} (log: {log.prod_count}, client: {client.prod_count})")
                print(f"  - vm_count: {vm_count} (log: {log.vm_count}, client: {client.vm_count})")
                print(f"  - client_vm_count: {client_vm_count} (log: {log.client_vm_count}, client: {client.client_vm_count})")
                print(f"  - client_vm_cost: {client_vm_cost} (log: {log.client_vm_cost}, client: {client.client_vm_cost})")
                
                periods.append({
                    'start_date': period_start,
                    'end_date': period_end,
                    'license_tier': log.license_tier,
                    'tier_cost': tier_cost,
                    'additional_cost': log.additional_cost,
                    'days': (period_end - period_start).days + 1,
                    'total_days_in_month': total_days_in_month,
                    'client': client,
                    'effective_date': period_effective_date,
                    # Include machine counts for this period
                    'dev_count': dev_count,
                    'prod_count': prod_count,
                    'vm_count': vm_count,
                    'client_vm_count': client_vm_count,
                    'client_vm_cost': client_vm_cost  # ✅ ADDED: client_vm_cost from change log
                })
                
                previous_end = period_end
        
        # If no change logs found, create a single period for the entire month
        if not periods:
            # Use month_start as effective_date when no logs exist
            effective_date = month_start
            
            tier_cost = self.get_tier_cost_for_period(None, client)
            
            print(f"🔍 DEBUG Creating default period with client values:")
            print(f"  - client.client_vm_count: {client.client_vm_count}")
            print(f"  - client.client_vm_cost: {client.client_vm_cost}")
            print(f"  - client.vm_count: {client.vm_count}")
            
            periods.append({
                'start_date': effective_date,  # Use month_start as effective_date
                'end_date': month_end,
                'license_tier': client.license_tier,
                'tier_cost': tier_cost,
                'additional_cost': client.additional_cost,
                'days': (month_end - effective_date).days + 1,
                'total_days_in_month': total_days_in_month,
                'client': client,
                'effective_date': effective_date,
                # Use current client machine counts and costs
                'dev_count': client.dev_count,
                'prod_count': client.prod_count,
                'vm_count': client.vm_count,
                'client_vm_count': client.client_vm_count,
                'client_vm_cost': client.client_vm_cost  # ✅ ADDED: from client table
            })
        
        print(f"Found {len(periods)} periods for month {month_start} to {month_end}:")
        for i, period in enumerate(periods):
            print(f"Period {i+1}: {period['license_tier']} from {period['start_date']} to {period['end_date']}")
            print(f"  Effective Date: {period.get('effective_date', 'Not set')}")
            print(f"  Tier Cost: ${period['tier_cost']:.2f}, Days: {period['days']}")
            print(f"  Machine Counts - Dev: {period['dev_count']}, Prod: {period['prod_count']}, VM: {period['vm_count']}, Client VM: {period['client_vm_count']}")
            print(f"  Client VM Cost: ${period.get('client_vm_cost', 'Not set')}")
        
        return periods

    def get_tier_cost_for_period(self, change_log, client):
        """
        Get the correct tier cost for a period.
        Priority: change_log tier_cost -> client tier_cost -> default tier cost
        """
        if change_log and change_log.tier_cost is not None:
            return float(change_log.tier_cost)
        elif client.tier_cost is not None:
            return float(client.tier_cost)
        else:
            # Fallback to default tier costs
            base_cost_map = {'lite': 600, 'standard': 3500, 'pro': 10500, 'enterprise': 22500}
            license_tier = change_log.license_tier if change_log else client.license_tier
            return base_cost_map.get(license_tier, 0)

    def calculate_period_cost(self, period, transaction_counts, total_days_in_month):
        """
        Calculate cost for a specific tier period
        """
        license_tier = period['license_tier']
        period_days = period['days']
        monthly_tier_cost = period['tier_cost']
        
        # Prorate the monthly tier cost based on days in period
        base_cost = (monthly_tier_cost / total_days_in_month) * period_days
        base_per_day = base_cost / period_days if period_days > 0 else 0
        
        print(f"=== CALCULATING PERIOD COST ===")
        print(f"Period: {period['start_date']} to {period['end_date']}")
        print(f"License Tier: {license_tier}")
        print(f"Monthly tier cost: ${monthly_tier_cost:.2f}")
        print(f"Total days in month: {total_days_in_month}, Period days: {period_days}")
        print(f"Prorated base cost: ${base_cost:.2f}, Base per day: ${base_per_day:.2f}")
        
        # Get slab configuration for this period
        slab_config = self.get_slab_config_period(period)
        config = self.build_tier_config(license_tier, slab_config)
        
        print(f"Final calculation config: {config}")
        
        # Calculate transactions for this period
        period_transactions = 0
        for date_str, count in transaction_counts.items():
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            if period['start_date'] <= date_obj <= period['end_date']:
                period_transactions += count
        
        print(f"Transactions in period: {period_transactions}")
        
        # Calculate cost based on tier type
        if license_tier == 'lite':
            rate = float(config.get('rate', 0.01))
            variable_cost = period_transactions * rate
            total_cost = base_cost + variable_cost
            
            print(f"Lite tier calculation:")
            print(f"  Rate: ${rate:.4f}/transaction")
            print(f"  Variable cost: {period_transactions} × ${rate:.4f} = ${variable_cost:.2f}")
            print(f"  Total cost: ${base_cost:.2f} + ${variable_cost:.2f} = ${total_cost:.2f}")
            
            result = {
                'base_cost': base_cost,
                'variable_cost': variable_cost,
                'total_cost': total_cost,
                'transactions': period_transactions,
                'period_days': period_days,
                'license_tier': license_tier,
                'rate': rate,
                'excess_transactions': period_transactions,
                'config': config
            }
        else:
            # For other tiers, calculate based on slabs
            tier1 = float(config.get('tier1', 0))
            tier2 = float(config.get('tier2', tier1))
            rate1 = float(config.get('rate1', 0.07))
            rate2 = float(config.get('rate2', rate1))
            
            excess_transactions = max(0, period_transactions - tier1)
            
            print(f"Standard/Pro/Enterprise tier calculation:")
            print(f"  Tier 1: {tier1:.0f} transactions included")
            print(f"  Tier 2: {tier2:.0f} transactions")
            print(f"  Rate 1: ${rate1:.4f}/transaction")
            print(f"  Rate 2: ${rate2:.4f}/transaction")
            print(f"  Excess transactions: {excess_transactions}")
            
            # FIXED CALCULATION LOGIC
            if period_transactions <= tier1:
                variable_cost = 0
                print(f"  No excess transactions, variable cost: $0")
            elif tier1 == tier2:  
                # Single tier pricing - all excess transactions charged at rate1
                variable_cost = (period_transactions - tier1) * rate1
                print(f"  Single tier pricing:")
                print(f"    Excess transactions: {period_transactions - tier1}")
                print(f"    Rate: ${rate1:.4f}/transaction")
                print(f"    Variable cost: {period_transactions - tier1} × ${rate1:.4f} = ${variable_cost:.2f}")
            elif period_transactions <= tier2:
                # Only tier1 excess (between tier1 and tier2)
                variable_cost = (period_transactions - tier1) * rate1
                print(f"  Tier 1 excess:")
                print(f"    Excess transactions: {period_transactions - tier1}")
                print(f"    Rate: ${rate1:.4f}/transaction")
                print(f"    Variable cost: {period_transactions - tier1} × ${rate1:.4f} = ${variable_cost:.2f}")
            else:
                # Both tier1 and tier2 excess (above tier2)
                tier1_excess = tier2 - tier1
                tier2_excess = period_transactions - tier2
                variable_cost = (tier1_excess * rate1) + (tier2_excess * rate2)
                print(f"  Multi-tier excess:")
                print(f"    Tier 1 excess: {tier1_excess} × ${rate1:.4f} = ${tier1_excess * rate1:.2f}")
                print(f"    Tier 2 excess: {tier2_excess} × ${rate2:.4f} = ${tier2_excess * rate2:.2f}")
                print(f"    Total variable cost: ${variable_cost:.2f}")
            
            total_cost = base_cost + variable_cost
            print(f"  Total cost: ${base_cost:.2f} + ${variable_cost:.2f} = ${total_cost:.2f}")
            
            result = {
                'base_cost': base_cost,
                'variable_cost': variable_cost,
                'total_cost': total_cost,
                'transactions': period_transactions,
                'period_days': period_days,
                'license_tier': license_tier,
                'rate1': rate1,
                'rate2': rate2,
                'excess_transactions': excess_transactions,
                'tier1': tier1,
                'tier2': tier2,
                'config': config
            }
        
        print(f"=== PERIOD COST CALCULATION COMPLETE ===\n")
        return result

    def get_slab_config_period(self, period):
        """
        Get slab configuration for a specific period using the period's additional_cost.
        """
        print(f"🔍 Getting slab config for period {period['start_date']} to {period['end_date']}")
        
        # Check if period has additional_cost
        additional_cost = period.get('additional_cost')
        print(f"📋 Period additional_cost: {additional_cost}")
        print(f"📋 Type: {type(additional_cost)}")
        
        if additional_cost and isinstance(additional_cost, dict):
            print(f"✅ Period has additional_cost dict")
            print(f"📊 Discount keys found: {[k for k in additional_cost.keys() if 'discount' in k]}")
            
            # Check if it has discount configuration
            if any(key in additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                print("🎯 Found discount configuration keys")
                converted_config = self.convert_discount_to_tier_config(additional_cost)
                print(f"✅ Converted to tier config: {converted_config}")
                
                if converted_config:
                    print(f"🚀 Returning period-specific slab config")
                    return converted_config
                else:
                    print("❌ Conversion returned None")
            else:
                print("❌ No discount keys found in additional_cost")
        else:
            print("❌ Period has no additional_cost or it's not a dict")
        
        # Fallback to current client's additional_cost
        client = period.get('client')
        if client:
            client_additional_cost = getattr(client, 'additional_cost', None)
            print(f"🔄 Checking client fallback: {client_additional_cost}")
            
            if client_additional_cost and isinstance(client_additional_cost, dict):
                if any(key in client_additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                    converted_config = self.convert_discount_to_tier_config(client_additional_cost)
                    print(f"🔄 Using client slab config as fallback: {converted_config}")
                    return converted_config
        
        print("🚨 No slab config found for period, will use defaults")
        return None
    
    def get_client_email(self, client):
        """
        Get the email for a client by finding users with 'client' role
        associated with this client.
        """
        try:
            # Find users with this client foreign key and role='client'
            client_users = User.objects.filter(
                client=client,
                roles="client"
            )
            
            if client_users.exists():
                # Get the first client user's email
                client_user = client_users.first()
                client_email = client_user.mail
                print(f"Found client user with email: {client_email}")
                return client_email
            else:
                # Fallback: check if any user with this client has an email
                any_user = User.objects.filter(client=client).exclude(mail__isnull=True).exclude(mail__exact='').first()
                if any_user:
                    print(f"Using email from user with role '{any_user.roles}': {any_user.mail}")
                    return any_user.mail
                else:
                    print("No users found with email for this client")
                    return None
                    
        except Exception as e:
            print(f"Error getting client email: {str(e)}")
            return None
        
    def calculate_machine_costs_for_period(self, period, total_days_in_month):
        """
        Calculate machine costs for a specific period based on period machine counts
        Use client_vm_cost from ClientChangeLog ONLY for Virtual Machines (regular VMs)
        """
        period_days = period['days']
        
        # Default machine rates
        DEV_MACHINE_RATE = 200.00
        PROD_MACHINE_RATE = 400.00
        CLIENT_VM_RATE = 300.00  # Fixed rate for Client VMs
        
        # Debug what's in the period
        print(f"🔍 DEBUG in calculate_machine_costs_for_period:")
        print(f"  - period.get('client_vm_cost'): {period.get('client_vm_cost')}")
        print(f"  - period.get('vm_count'): {period.get('vm_count')}")
        print(f"  - period.get('client_vm_count'): {period.get('client_vm_count')}")
        
        # Get VM rate from period (from ClientChangeLog) - ONLY for regular VMs
        client_vm_cost_value = period.get('client_vm_cost')
        if client_vm_cost_value is not None:
            try:
                VM_MACHINE_RATE = float(client_vm_cost_value)
                print(f"✅ Using VM rate from period data (client_vm_cost): ${VM_MACHINE_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting client_vm_cost to float: {e}, using default")
                VM_MACHINE_RATE = 300.00
        else:
            # Default VM rate
            VM_MACHINE_RATE = 300.00
            print(f"ℹ️ Using default VM rate (client_vm_cost was None): ${VM_MACHINE_RATE:.2f}")
        
        print(f"ℹ️ Client VM rate (fixed): ${CLIENT_VM_RATE:.2f}")
        
        # Get machine counts for this period
        dev_count = period.get('dev_count', 0)
        prod_count = period.get('prod_count', 0)
        vm_count = period.get('vm_count', 0)
        client_vm_count = period.get('client_vm_count', 0)
        
        print(f"Calculating machine costs for period {period['start_date']} to {period['end_date']}:")
        print(f"  Dev: {dev_count}, Prod: {prod_count}, VM: {vm_count}, Client VM: {client_vm_count}")
        print(f"  Period days: {period_days}, Total month days: {total_days_in_month}")
        print(f"  VM Rate (from client_vm_cost): ${VM_MACHINE_RATE:.2f}/month")
        print(f"  Client VM Rate (fixed): ${CLIENT_VM_RATE:.2f}/month")
        
        # Calculate monthly costs
        monthly_dev_cost = dev_count * DEV_MACHINE_RATE
        monthly_prod_cost = prod_count * PROD_MACHINE_RATE
        monthly_vm_cost = vm_count * VM_MACHINE_RATE  # Uses client_vm_cost from DB
        monthly_client_vm_cost = client_vm_count * CLIENT_VM_RATE  # Uses fixed rate
        
        # Prorate based on days in period
        dev_cost = (monthly_dev_cost / total_days_in_month) * period_days
        prod_cost = (monthly_prod_cost / total_days_in_month) * period_days
        vm_cost = (monthly_vm_cost / total_days_in_month) * period_days
        client_vm_cost = (monthly_client_vm_cost / total_days_in_month) * period_days
        
        total_machine_cost = dev_cost + prod_cost + vm_cost + client_vm_cost
        
        print(f"  Monthly costs - Dev: ${monthly_dev_cost:.2f}, Prod: ${monthly_prod_cost:.2f}, VM: ${monthly_vm_cost:.2f}, Client VM: ${monthly_client_vm_cost:.2f}")
        print(f"  Prorated costs - Dev: ${dev_cost:.2f}, Prod: ${prod_cost:.2f}, VM: ${vm_cost:.2f}, Client VM: ${client_vm_cost:.2f}")
        print(f"  Total machine cost for period: ${total_machine_cost:.2f}")
        
        return {
            'dev_cost': dev_cost,
            'prod_cost': prod_cost,
            'vm_cost': vm_cost,
            'client_vm_cost': client_vm_cost,
            'total_machine_cost': total_machine_cost,
            'dev_count': dev_count,
            'prod_count': prod_count,
            'vm_count': vm_count,
            'client_vm_count': client_vm_count,
            'vm_rate': VM_MACHINE_RATE,      # Rate for regular VMs (from client_vm_cost)
            'client_vm_rate': CLIENT_VM_RATE # Fixed rate for Client VMs
        }

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        # --- Get client (using the new get_client method) ---
        client, error = self.get_client(request)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        # --- Get selected month ---
        selected_date_str = request.GET.get("selected_date")
        if not selected_date_str:
            return Response({"error": "Selected date is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            selected_date = parse(selected_date_str)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

        current_month = timezone.now().date().replace(day=1)
        selected_month = selected_date.replace(day=1).date()
        if selected_month >= current_month:
            return Response({"error": "Invoices can only be generated for previous months"}, status=status.HTTP_400_BAD_REQUEST)

        # --- Compute start and end date for the month ---
        import calendar
        start_date = selected_date.replace(day=1).date()    
        last_day = calendar.monthrange(selected_date.year, selected_date.month)[1]
        end_date = selected_date.replace(day=last_day).date()

        print(f"Generating invoice for client {client.client_name} (ID: {client.client_id}) for period {start_date} → {end_date}")

        # ==================================================
        # Fetch transaction count from External API
        # ==================================================
        external_api_url = "http://droidmetrix.droidal.com/get_client_trans_count"
        headers = {
            "Authorization": "Basic cXYwZmptNThmOTpibmQ4cmthbnNt",
            "Content-Type": "application/json",
        }
        
        client_mail = self.get_client_email(client)
        if not client_mail:
            return Response(
                {"error": "No email found for client. Please ensure at least one user with 'client' role is associated with this client."},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f"Using client email for external API: {client_mail}")
        
        params = {
            "client_name": client_mail,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }

        try:
            response = requests.get(external_api_url, headers=headers, params=params, timeout=20)
            print("External API response status:", response.status_code)
            if response.status_code != 200:
                return Response(
                    {"error": f"External API error: {response.status_code}", "details": response.text},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            transaction_data = response.json()
            print("Transaction data received:", transaction_data)
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to fetch transaction data: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        # ==================================================
        # Prepare transaction_counts dict
        # ==================================================
        transaction_counts = {item["date"]: int(item["total_transaction"]) for item in transaction_data}
        total_transactions = sum(transaction_counts.values())

        print(f"Total transactions: {total_transactions}")

        # ==================================================
        # Fetch API usage count from Database
        # ==================================================
        total_api_calls = self.get_api_usage_count(client, start_date, end_date)
        print(f"Total API calls from DB: {total_api_calls}")

        # ==================================================
        # Get tier periods and calculate costs
        # ==================================================
        tier_periods = self.get_tier_periods_for_month(client, start_date, end_date)
        total_days_in_month = (end_date - start_date).days + 1
        
        # Calculate costs for each period
        all_period_items = []
        total_base_cost = 0
        total_variable_cost = 0
        total_transaction_cost = 0
        total_machine_cost = 0
        total_dev_cost = 0
        total_prod_cost = 0
        total_vm_cost = 0
        total_client_vm_cost = 0

        for i, period in enumerate(tier_periods):
            # Calculate transaction costs for this period
            period_cost = self.calculate_period_cost(period, transaction_counts, total_days_in_month)
            
            # Calculate machine costs for this period
            machine_costs = self.calculate_machine_costs_for_period(period, total_days_in_month)
            
            period_items = []
            
            # Base license cost for this period
            if period_cost['base_cost'] > 0:
                period_items.append({
                    'description': f'Base License Cost ({period["license_tier"].title()}) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': 1,
                    'price': period_cost['base_cost'],
                    'total': period_cost['base_cost']
                })
            
            # Variable transaction cost for this period
            if period_cost['variable_cost'] > 0:
                if period["license_tier"] == 'lite':
                    period_items.append({
                        'description': f'Transaction Usage ({period_cost["transactions"]:,} transactions @ ${period_cost.get("rate", 0.01):.2f}/transaction)',
                        'quantity': period_cost['transactions'],
                        'price': period_cost.get('rate', 0.01),
                        'total': period_cost['variable_cost']
                    })
                else:
                    period_items.append({
                        'description': f'Variable Transaction Usage ({period_cost["excess_transactions"]:,} transactions @ ${period_cost.get("rate1", 0.07):.2f}/transaction)',
                        'quantity': period_cost['excess_transactions'],
                        'price': period_cost.get('rate1', 0.07),
                        'total': period_cost['variable_cost']
                    })
            
            # Machine costs for this period
            if machine_costs['dev_cost'] > 0:
                period_items.append({
                    'description': f'Development Machines ({machine_costs["dev_count"]} machines @ $200.00/machine) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': machine_costs['dev_count'],
                    'price': 200.00,
                    'total': machine_costs['dev_cost']
                })
            
            if machine_costs['prod_cost'] > 0:
                period_items.append({
                    'description': f'Production Machines ({machine_costs["prod_count"]} machines @ $400.00/machine) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': machine_costs['prod_count'],
                    'price': 400.00,
                    'total': machine_costs['prod_cost']
                })
            
            # Virtual Machines (regular VMs) - uses client_vm_cost from DB
            if machine_costs['vm_cost'] > 0:
                vm_rate = machine_costs.get('vm_rate', 300.00)
                period_items.append({
                    'description': f'Virtual Machines ({machine_costs["vm_count"]} VMs @ ${vm_rate:.2f}/VM) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': machine_costs['vm_count'],
                    'price': vm_rate,
                    'total': machine_costs['vm_cost']
                })

            # Client Virtual Machines - uses fixed rate
            if machine_costs['client_vm_cost'] > 0:
                client_vm_rate = machine_costs.get('client_vm_rate', 300.00)  # Fixed rate
                period_items.append({
                    'description': f'Client Virtual Machines ({machine_costs["client_vm_count"]} VMs @ ${client_vm_rate:.2f}/VM) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': machine_costs['client_vm_count'],
                    'price': client_vm_rate,  # Fixed rate for Client VMs
                    'total': machine_costs['client_vm_cost']
                })
            
            # Initial period total (transaction + machine costs)
            period_total = period_cost['total_cost'] + machine_costs['total_machine_cost']
            
            all_period_items.append({
                'period_number': i + 1,
                'license_tier': period["license_tier"],
                'start_date': period["start_date"],
                'end_date': period["end_date"],
                'days': period["days"],
                'items': period_items,
                'period_total': period_total,  # Will be updated with AI cost later
                'transactions': period_cost['transactions'],
                'base_cost': period_cost['base_cost'],
                'variable_cost': period_cost['variable_cost'],
                'machine_cost': machine_costs['total_machine_cost'],
                'dev_cost': machine_costs['dev_cost'],
                'prod_cost': machine_costs['prod_cost'],
                'vm_cost': machine_costs['vm_cost'],
                'client_vm_cost': machine_costs['client_vm_cost'],
                'ai_cost': 0.00  # Will be updated later
            })
            
            total_base_cost += period_cost['base_cost']
            total_variable_cost += period_cost['variable_cost']
            total_transaction_cost += period_cost['total_cost']
            total_machine_cost += machine_costs['total_machine_cost']
            total_dev_cost += machine_costs['dev_cost']
            total_prod_cost += machine_costs['prod_cost']
            total_vm_cost += machine_costs['vm_cost']
            total_client_vm_cost += machine_costs['client_vm_cost']

        # ==================================================
        # CREATE OTHER COST ITEMS (API, AI) - Machines are now in period items
        # ==================================================
        other_items = []

        # API cost
        api_cost = total_api_calls * 0.10 if total_api_calls > 0 else 0
        if api_cost > 0:
            other_items.append({
                'description': f'API Usage Cost ({total_api_calls:,} API calls)',
                'quantity': total_api_calls,
                'price': 0.10,
                'total': api_cost
            })

        # AI cost
        ai_monthly_cost = 200.00
        total_ai_cost = 0.00

        # Calculate full calendar month days (should be 30 for September)
        full_calendar_days = (end_date - start_date).days + 1
        print(f"Full calendar month days for AI cost calculation: {full_calendar_days}")

        # Calculate AI cost for each period and add to period items
        for i, period in enumerate(tier_periods):
            period_days = period['days']
            
            # Calculate AI cost for this period
            period_ai_cost = (ai_monthly_cost / full_calendar_days) * period_days
            total_ai_cost += period_ai_cost
            
            print(f"AI Cost for period {period['start_date']} to {period['end_date']}:")
            print(f"  Period days: {period_days}, Full calendar days: {full_calendar_days}")
            print(f"  Monthly AI cost: ${ai_monthly_cost:.2f}")
            print(f"  Daily AI cost: ${ai_monthly_cost/full_calendar_days:.4f}")
            print(f"  Prorated AI cost: ${period_ai_cost:.2f}")
            
            # Add AI cost to the period items
            if period_ai_cost > 0:
                all_period_items[i]['items'].append({
                    'description': f'AI Processing Cost - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': 1,
                    'price': period_ai_cost,
                    'total': period_ai_cost
                })
                
                # Update period total to include AI cost
                all_period_items[i]['period_total'] += period_ai_cost
                all_period_items[i]['ai_cost'] = period_ai_cost  # Add to breakdown

        print(f"Total AI Cost: ${total_ai_cost:.2f}")

        # ==================================================
        # CALCULATE FINAL TOTALS CORRECTLY
        # ==================================================
        
        # Calculate total by summing all period totals (which now include AI cost)
        total_period_costs = sum(period['period_total'] for period in all_period_items)
        other_costs_total = sum(item['total'] for item in other_items)  # This is only API cost
        
        # Final total should be sum of all period totals + API cost
        total = total_period_costs + other_costs_total
        
        # Subtotal should be the same as total since all costs are included
        sub_total = total

        print(f"=== FINAL TOTALS ===")
        print(f"Total period costs (transaction + machine + AI): ${total_period_costs:.2f}")
        print(f"API cost: ${other_costs_total:.2f}")
        print(f"Grand total: ${total:.2f}")
        print(f"====================")

        # ==================================================
        # PREPARE INVOICE DATA FOR TEMPLATE
        # ==================================================
        invoice_nr = f"INV-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        bill_to = client.client_name
        
        # Get client email
        bill_to_email = client_mail
        
        # Format dates
        invoice_date = timezone.now().strftime('%Y-%m-%d')
        payment_due = (timezone.now() + timezone.timedelta(days=30)).strftime('%Y-%m-%d')
        order_id = f"ORD-{selected_date.strftime('%Y%m')}"
        
        # Create billing period string
        billing_period = f"{start_date.strftime('%B %d, %Y')} - {end_date.strftime('%B %d, %Y')}"

        logo_base64 = None
        logo_path = os.path.join(settings.MEDIA_ROOT, 'droidal_logo_new.png')
        if os.path.exists(logo_path):
            try:
                with open(logo_path, 'rb') as f:
                    logo_data = base64.b64encode(f.read()).decode('utf-8')
                logo_base64 = f"data:image/png;base64,{logo_data}"
                print("Logo embedded as base64 successfully")
            except Exception as e:
                print(f"Error embedding logo: {e}")
        else:
            print(f"Logo file not found at {logo_path}") 

        # ==================================================
        # GENERATE PDF
        # ==================================================
        html_content = render_to_string('invoice.html', {
            'invoice_nr': invoice_nr,
            'bill_to': bill_to,
            'bill_to_email': bill_to_email,
            'bill_to_address': getattr(client, "address", ""),  
            'bill_to_tax_id': getattr(client, "tax_id", ""),
            'invoice_date': invoice_date,
            'payment_due': payment_due,
            'order_id': order_id,
            'billing_period': billing_period,
            'period_items': all_period_items,
            'other_items': other_items,
            'sub_total': sub_total,
            'total': total,
            'client': client,
            'selected_month': selected_date.strftime('%B %Y'),
            'total_transactions': total_transactions,
            'total_api_calls': total_api_calls,
            'tier_periods': tier_periods,
            'logo_base64': logo_base64,
            # Add machine cost breakdown
            'total_machine_cost': total_machine_cost,
            'total_dev_cost': total_dev_cost,
            'total_prod_cost': total_prod_cost,
            'total_vm_cost': total_vm_cost,
            'total_client_vm_cost': total_client_vm_cost
        })

        pdf_data = htmltopdf(html_content)
        if pdf_data:
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_{invoice_nr}_{client.client_name.replace(" ", "_")}.pdf"'
            return response
        else:
            return Response({"error": "Error generating PDF"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def calculate_cost_breakdown(self, transaction_counts, license_tier, dev_count, prod_count, vm_count, total_api_calls, client, selected_date):
        import calendar
        from datetime import datetime, date, timedelta

        # Determine the month and number of days
        year, month = selected_date.year, selected_date.month
        days_in_month = calendar.monthrange(year, month)[1]
        
        month_start = date(year, month, 1)
        month_end = date(year, month, days_in_month)

        # Get tier periods for the month
        tier_periods = self.get_tier_periods_for_month(client, month_start, month_end)
        
        # Calculate costs for each period
        total_base_cost = 0
        total_variable_cost = 0
        total_transactions = 0
        period_breakdown = []

        for period in tier_periods:
            period_cost = self.calculate_period_cost(period, transaction_counts, days_in_month)
            total_base_cost += period_cost['base_cost']
            total_variable_cost += period_cost['variable_cost']
            total_transactions += period_cost['transactions']
            period_breakdown.append(period_cost)

        total_transaction_cost = total_base_cost + total_variable_cost

        # Calculate AI cost prorated by periods - FIXED: Use full calendar month days
        ai_monthly_cost = 200.00
        total_ai_cost = 0.00
        
        for period in tier_periods:
            period_days = period['days']
            # FIX: Use days_in_month (full calendar) instead of period adjusted days
            period_ai_cost = (ai_monthly_cost / days_in_month) * period_days
            total_ai_cost += period_ai_cost

        # Calculate excess transactions (for display purposes)
        # Use the first period's config for excess calculation
        first_period_config = self.build_tier_config(tier_periods[0]['license_tier'], None)
        tier1 = float(first_period_config.get('tier1', 0))
        excess_transactions = max(0, total_transactions - tier1)

        # Machine costs with new pricing
        dev_machine_cost = dev_count * 200.00 if dev_count > 0 else 0
        prod_machine_cost = prod_count * 400.00 if prod_count > 0 else 0
        vm_machine_cost = vm_count * 300.00 if vm_count > 0 else 0

        # API cost
        api_cost = total_api_calls * 0.10 if total_api_calls > 0 else 0

        # Build cost breakdown
        cost_breakdown = {
            'base_transaction_cost': round(total_base_cost, 2),
            'variable_transaction_cost': round(total_variable_cost, 2),
            'transaction_cost': round(total_transaction_cost, 2),
            'additional_trans_cost': round(total_variable_cost, 2),
            'dev_machine_cost': round(dev_machine_cost, 2),
            'prod_machine_cost': round(prod_machine_cost, 2),
            'vm_machine_cost': round(vm_machine_cost, 2),
            'api_cost': round(api_cost, 2),
            'ai_cost': round(total_ai_cost, 2),
            'days_with_transactions': len([count for count in transaction_counts.values() if count > 0]),
            'total_transactions': total_transactions,
            'excess_transactions': excess_transactions,
            'transaction_limit': tier1,
            'additional_rate': additional_rate,
            'tier_periods': tier_periods,
            'period_breakdown': period_breakdown,
        }

        return cost_breakdown
    

class GenerateInvoicePreviewView(APIView):
    """Generate invoice PDF for authenticated user's client or specified client_id for selected month"""

    permission_classes = [IsAuthenticated]

    def get_client(self, request):
        """
        Get client based on client_id parameter or authenticated user's client.
        Returns client object or None with error message.
        """
        client_id = request.GET.get("client_id")
        
        if client_id:
            try:
                client = Client.objects.get(client_id=client_id)
                print(f"Fetched client by ID {client_id}: {client.client_name}")
                return client, None
            except Client.DoesNotExist:
                return None, "Client not found"
        else:
            try:
                client = request.user.client
                if client is None:
                    return None, "User does not have an associated client"
                return client, None
            except AttributeError:
                return None, "User does not have an associated client"

    def get_slab_config_period(self, period):
        """
        Get slab configuration for a specific period using the period's additional_cost.
        """
        print(f"Getting slab config for period {period['start_date']} to {period['end_date']}")
        print(f"Period additional_cost: {period.get('additional_cost')}")
        
        # Check if period has additional_cost
        if period.get('additional_cost') and isinstance(period['additional_cost'], dict):
            additional_cost = period['additional_cost']
            print(f"Processing period additional_cost: {additional_cost}")
            
            if any(key in additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                converted_config = self.convert_discount_to_tier_config(additional_cost)
                print(f"✅ Using period-specific slab config: {converted_config}")
                return converted_config
            else:
                print("❌ Period has additional_cost but no discount keys found")
        else:
            print("❌ Period has no additional_cost or it's not a dict")
        
        # Fallback to current client's additional_cost
        client = period.get('client')
        if client and hasattr(client, 'additional_cost') and client.additional_cost and isinstance(client.additional_cost, dict):
            additional_cost = client.additional_cost
            print(f"Processing client additional_cost: {additional_cost}")
            
            if any(key in additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                converted_config = self.convert_discount_to_tier_config(additional_cost)
                print(f"🔄 Using client slab config as fallback: {converted_config}")
                return converted_config
        
        print("🚨 No slab config found for period, using defaults")
        return None

    def convert_discount_to_tier_config(self, discount_config):
        """
        Convert discount-based configuration to tier-based configuration.
        """
        print(f"🔄 Converting discount config: {discount_config}")
        
        tier_config = {}
        
        try:
            # Handle discount1_from (this becomes tier1 - the threshold)
            if 'discount1_from' in discount_config:
                discount1_from = discount_config['discount1_from']
                print(f"📥 Processing discount1_from: {discount1_from} (type: {type(discount1_from)})")
                
                if discount1_from is not None:
                    try:
                        tier1_value = float(discount1_from)
                        tier_config['tier1'] = tier1_value
                        print(f"✅ Set tier1: {tier1_value}")
                    except (TypeError, ValueError) as e:
                        print(f"❌ Error converting discount1_from: {e}")
            
            # Handle discount_1 (this becomes rate1)
            if 'discount_1' in discount_config:
                discount_1 = discount_config['discount_1']
                print(f"📥 Processing discount_1: {discount_1} (type: {type(discount_1)})")
                
                if discount_1 is not None:
                    try:
                        rate1_value = float(discount_1)
                        tier_config['rate1'] = rate1_value
                        print(f"✅ Set rate1: {rate1_value}")
                    except (TypeError, ValueError) as e:
                        print(f"❌ Error converting discount_1: {e}")
            
            # For single-tier pricing, set tier2 = tier1 and rate2 = rate1
            if 'tier1' in tier_config and 'rate1' in tier_config:
                tier_config['tier2'] = tier_config['tier1']
                tier_config['rate2'] = tier_config['rate1']
                print(f"🔄 Set tier2 and rate2 to match tier1 and rate1")
            
            print(f"🎯 Final converted tier config: {tier_config}")
            
        except Exception as e:
            print(f"💥 Unexpected error in convert_discount_to_tier_config: {e}")
            import traceback
            traceback.print_exc()
            return None
            
        return tier_config if tier_config else None

    def build_tier_config(self, license_tier, slab_config):
        """
        Build tier configuration based on license tier and slab config.
        """
        default_config = self.get_default_tier_config(license_tier)
        
        if not slab_config:
            print(f"Using default config for {license_tier}: {default_config}")
            return default_config
        
        try:
            merged_config = default_config.copy()
            
            # Only override defaults with values that exist in slab_config
            for key in ['tier1', 'tier2', 'rate1', 'rate2', 'rate']:
                if key in slab_config and slab_config[key] is not None:
                    try:
                        merged_config[key] = float(slab_config[key])
                        print(f"✅ Overriding {key} with custom value: {slab_config[key]}")
                    except (TypeError, ValueError):
                        print(f"❌ Invalid {key} value in slab_config, using default: {slab_config[key]}")
            
            print(f"Final merged config for {license_tier}: {merged_config}")
            return merged_config
            
        except Exception as e:
            print(f"❌ Error merging tier config: {e}")
            return default_config

    def get_default_tier_config(self, license_tier):
        """Get the default tier configuration for each license tier."""
        if license_tier == 'lite':
            return {'rate': 0.01}
        elif license_tier == 'standard':
            return {
                'tier1': 25000.0,
                'tier2': 25000.0,
                'rate1': 0.07,
                'rate2': 0.07
            }
        elif license_tier == 'pro':
            return {
                'tier1': 70000.0,
                'tier2': 70000.0,
                'rate1': 0.07,
                'rate2': 0.07
            }
        elif license_tier == 'enterprise':
            return {
                'tier1': 200000.0,
                'tier2': 200000.0,
                'rate1': 0.07,
                'rate2': 0.07
            }
        else:
            return {
                'tier1': 0.0,
                'tier2': 0.0,
                'rate1': 0.0,
                'rate2': 0.0
            }

    def get_api_usage_count(self, client, start_date, end_date):
        """
        Fetch API usage count from ClientApiUsage table for the given client and date range.
        """
        try:
            # Get all API keys associated with this client's users
            user_api_keys = Agent_API_SecretKeyss.objects.filter(
                user__client=client
            ).values_list('api_key', flat=True)
            
            # Sum the count from ClientApiUsage for these API keys in the date range
            api_usage = ClientApiUsage.objects.filter(
                apikey__api_key__in=user_api_keys,
                date__gte=start_date,
                date__lte=end_date
            ).aggregate(total_count=Sum('count'))
            
            total_api_calls = api_usage['total_count'] or 0
            print(f"Total API calls from DB for client {client.client_name}: {total_api_calls}")
            
            return total_api_calls
            
        except Exception as e:
            print(f"Error fetching API usage from DB: {e}")
            return 0

    def get_tier_periods_for_month(self, client, month_start, month_end):
        """
        Get all tier periods that were active during the selected month
        Respect effective_date from ClientChangeLog for each period.
        """
        # Get change logs that overlap with the selected month
        change_logs = ClientChangeLog.objects.filter(
            client=client,
            effective_from__lte=month_end,
        ).exclude(
            effective_to__lt=month_start
        ).order_by('effective_from')
        
        print(f"🔍 DEBUG: Checking ClientChangeLog for client {client.client_name}")
        print(f"🔍 DEBUG: Found {change_logs.count()} change logs")
        
        # Also check current client values
        print(f"🔍 DEBUG Current client values:")
        print(f"  - client.client_vm_count: {client.client_vm_count}")
        print(f"  - client.client_vm_cost: {client.client_vm_cost}")
        print(f"  - client.vm_count: {client.vm_count}")
        print(f"  - client.dev_vm_cost: {client.dev_vm_cost}")
        print(f"  - client.prod_vm_cost: {client.prod_vm_cost}")
        print(f"  - client.client_virtual_machine_cost: {client.client_virtual_machine_cost}")
        
        periods = []
        total_days_in_month = (month_end - month_start).days + 1
        
        previous_end = month_start - timedelta(days=1)  # Start from day before month starts
        
        for log in change_logs:
            # Use effective_date from change log if available, otherwise use effective_from
            period_effective_date = None
            if log.effective_date:
                period_effective_date = log.effective_date.date()
                print(f"Using effective_date from change log: {period_effective_date}")
            elif log.effective_from:
                period_effective_date = log.effective_from.date()
                print(f"Using effective_from as effective_date: {period_effective_date}")
            else:
                # If no effective_date in log, use log's effective_from date
                period_effective_date = log.effective_from.date() if log.effective_from else month_start
                print(f"Using effective_from date as fallback: {period_effective_date}")
            
            # Adjust period start based on effective_date
            if period_effective_date:
                period_start = max(month_start, period_effective_date)
                print(f"Adjusted period_start considering effective_date: {period_start}")
            else:
                period_start = month_start
            
            # Avoid overlap with previous period
            if previous_end >= period_start:
                period_start = previous_end + timedelta(days=1)
            
            period_end = min(month_end, log.effective_to.date()) if log.effective_to else month_end
            
            # Only include periods that have at least one day
            if period_start <= period_end:
                # Get the correct tier cost for this period
                tier_cost = self.get_tier_cost_for_period(log, client)
                
                # Get machine counts from change log
                dev_count = log.dev_count if log.dev_count is not None else client.dev_count
                prod_count = log.prod_count if log.prod_count is not None else client.prod_count
                vm_count = log.vm_count if log.vm_count is not None else client.vm_count
                client_vm_count = log.client_vm_count if log.client_vm_count is not None else client.client_vm_count
                
                # Get ALL cost fields from change log
                dev_vm_cost = log.dev_vm_cost if log.dev_vm_cost is not None else client.dev_vm_cost
                prod_vm_cost = log.prod_vm_cost if log.prod_vm_cost is not None else client.prod_vm_cost
                client_vm_cost = log.client_vm_cost if log.client_vm_cost is not None else client.client_vm_cost
                client_virtual_machine_cost = log.client_virtual_machine_cost if log.client_virtual_machine_cost is not None else client.client_virtual_machine_cost
                
                print(f"🔍 DEBUG Period {len(periods)+1} values from log:")
                print(f"  - dev_count: {dev_count} (log: {log.dev_count}, client: {client.dev_count})")
                print(f"  - prod_count: {prod_count} (log: {log.prod_count}, client: {client.prod_count})")
                print(f"  - vm_count: {vm_count} (log: {log.vm_count}, client: {client.vm_count})")
                print(f"  - client_vm_count: {client_vm_count} (log: {log.client_vm_count}, client: {client.client_vm_count})")
                print(f"  - client_vm_cost: {client_vm_cost} (log: {log.client_vm_cost}, client: {client.client_vm_cost})")
                print(f"  - dev_vm_cost: {dev_vm_cost} (log: {log.dev_vm_cost}, client: {client.dev_vm_cost})")
                print(f"  - prod_vm_cost: {prod_vm_cost} (log: {log.prod_vm_cost}, client: {client.prod_vm_cost})")
                print(f"  - client_virtual_machine_cost: {client_virtual_machine_cost} (log: {log.client_virtual_machine_cost}, client: {client.client_virtual_machine_cost})")
                
                periods.append({
                    'start_date': period_start,
                    'end_date': period_end,
                    'license_tier': log.license_tier,
                    'tier_cost': tier_cost,
                    'additional_cost': log.additional_cost,
                    'days': (period_end - period_start).days + 1,
                    'total_days_in_month': total_days_in_month,
                    'client': client,
                    'effective_date': period_effective_date,
                    # Include machine counts for this period
                    'dev_count': dev_count,
                    'prod_count': prod_count,
                    'vm_count': vm_count,
                    'client_vm_count': client_vm_count,
                    # Include ALL cost fields (for future use)
                    'client_vm_cost': client_vm_cost,  # For vm_count
                    'dev_vm_cost': dev_vm_cost,
                    'prod_vm_cost': prod_vm_cost,
                    'client_virtual_machine_cost': client_virtual_machine_cost
                })
                
                previous_end = period_end
        
        # If no change logs found, create a single period for the entire month
        if not periods:
            # Use month_start as effective_date when no logs exist
            effective_date = month_start
            
            tier_cost = self.get_tier_cost_for_period(None, client)
            
            print(f"🔍 DEBUG Creating default period with client values:")
            print(f"  - client.client_vm_count: {client.client_vm_count}")
            print(f"  - client.client_vm_cost: {client.client_vm_cost}")
            print(f"  - client.vm_count: {client.vm_count}")
            print(f"  - client.dev_vm_cost: {client.dev_vm_cost}")
            print(f"  - client.prod_vm_cost: {client.prod_vm_cost}")
            print(f"  - client.client_virtual_machine_cost: {client.client_virtual_machine_cost}")
            
            periods.append({
                'start_date': effective_date,  # Use month_start as effective_date
                'end_date': month_end,
                'license_tier': client.license_tier,
                'tier_cost': tier_cost,
                'additional_cost': client.additional_cost,
                'days': (month_end - effective_date).days + 1,
                'total_days_in_month': total_days_in_month,
                'client': client,
                'effective_date': effective_date,
                # Use current client machine counts and costs
                'dev_count': client.dev_count,
                'prod_count': client.prod_count,
                'vm_count': client.vm_count,
                'client_vm_count': client.client_vm_count,
                # Include ALL cost fields from client
                'client_vm_cost': client.client_vm_cost,
                'dev_vm_cost': client.dev_vm_cost,
                'prod_vm_cost': client.prod_vm_cost,
                'client_virtual_machine_cost': client.client_virtual_machine_cost
            })
        
        print(f"Found {len(periods)} periods for month {month_start} to {month_end}:")
        for i, period in enumerate(periods):
            print(f"Period {i+1}: {period['license_tier']} from {period['start_date']} to {period['end_date']}")
            print(f"  Effective Date: {period.get('effective_date', 'Not set')}")
            print(f"  Tier Cost: ${period['tier_cost']:.2f}, Days: {period['days']}")
            print(f"  Machine Counts - Dev: {period['dev_count']}, Prod: {period['prod_count']}, VM: {period['vm_count']}, Client VM: {period['client_vm_count']}")
        
        return periods

    def get_tier_cost_for_period(self, change_log, client):
        """
        Get the correct tier cost for a period.
        Priority: change_log tier_cost -> client tier_cost -> default tier cost
        """
        if change_log and change_log.tier_cost is not None:
            return float(change_log.tier_cost)
        elif client.tier_cost is not None:
            return float(client.tier_cost)
        else:
            # Fallback to default tier costs
            base_cost_map = {'lite': 600, 'standard': 3500, 'pro': 10500, 'enterprise': 22500}
            license_tier = change_log.license_tier if change_log else client.license_tier
            return base_cost_map.get(license_tier, 0)

    def calculate_period_cost(self, period, transaction_counts, total_days_in_month):
        """
        Calculate cost for a specific tier period
        """
        license_tier = period['license_tier']
        period_days = period['days']
        monthly_tier_cost = period['tier_cost']
        
        # Prorate the monthly tier cost based on days in period
        base_cost = (monthly_tier_cost / total_days_in_month) * period_days
        base_per_day = base_cost / period_days if period_days > 0 else 0
        
        print(f"=== CALCULATING PERIOD COST ===")
        print(f"Period: {period['start_date']} to {period['end_date']}")
        print(f"License Tier: {license_tier}")
        print(f"Monthly tier cost: ${monthly_tier_cost:.2f}")
        print(f"Total days in month: {total_days_in_month}, Period days: {period_days}")
        print(f"Prorated base cost: ${base_cost:.2f}, Base per day: ${base_per_day:.2f}")
        
        # Get slab configuration for this period
        slab_config = self.get_slab_config_period(period)
        config = self.build_tier_config(license_tier, slab_config)
        
        print(f"Final calculation config: {config}")
        
        # Calculate transactions for this period
        period_transactions = 0
        for date_str, count in transaction_counts.items():
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            if period['start_date'] <= date_obj <= period['end_date']:
                period_transactions += count
        
        print(f"Transactions in period: {period_transactions}")
        
        # Calculate cost based on tier type
        if license_tier == 'lite':
            rate = float(config.get('rate', 0.01))
            variable_cost = period_transactions * rate
            total_cost = base_cost + variable_cost
            
            print(f"Lite tier calculation:")
            print(f"  Rate: ${rate:.4f}/transaction")
            print(f"  Variable cost: {period_transactions} × ${rate:.4f} = ${variable_cost:.2f}")
            print(f"  Total cost: ${base_cost:.2f} + ${variable_cost:.2f} = ${total_cost:.2f}")
            
            result = {
                'base_cost': base_cost,
                'variable_cost': variable_cost,
                'total_cost': total_cost,
                'transactions': period_transactions,
                'period_days': period_days,
                'license_tier': license_tier,
                'rate': rate,
                'excess_transactions': period_transactions,
                'config': config
            }
        else:
            # For other tiers, calculate based on slabs
            tier1 = float(config.get('tier1', 0))
            tier2 = float(config.get('tier2', tier1))
            rate1 = float(config.get('rate1', 0.07))
            rate2 = float(config.get('rate2', rate1))
            
            excess_transactions = max(0, period_transactions - tier1)
            
            print(f"Standard/Pro/Enterprise tier calculation:")
            print(f"  Tier 1: {tier1:.0f} transactions included")
            print(f"  Tier 2: {tier2:.0f} transactions")
            print(f"  Rate 1: ${rate1:.4f}/transaction")
            print(f"  Rate 2: ${rate2:.4f}/transaction")
            print(f"  Excess transactions: {excess_transactions}")
            
            # FIXED CALCULATION LOGIC
            if period_transactions <= tier1:
                variable_cost = 0
                print(f"  No excess transactions, variable cost: $0")
            elif tier1 == tier2:  
                # Single tier pricing - all excess transactions charged at rate1
                variable_cost = (period_transactions - tier1) * rate1
                print(f"  Single tier pricing:")
                print(f"    Excess transactions: {period_transactions - tier1}")
                print(f"    Rate: ${rate1:.4f}/transaction")
                print(f"    Variable cost: {period_transactions - tier1} × ${rate1:.4f} = ${variable_cost:.2f}")
            elif period_transactions <= tier2:
                # Only tier1 excess (between tier1 and tier2)
                variable_cost = (period_transactions - tier1) * rate1
                print(f"  Tier 1 excess:")
                print(f"    Excess transactions: {period_transactions - tier1}")
                print(f"    Rate: ${rate1:.4f}/transaction")
                print(f"    Variable cost: {period_transactions - tier1} × ${rate1:.4f} = ${variable_cost:.2f}")
            else:
                # Both tier1 and tier2 excess (above tier2)
                tier1_excess = tier2 - tier1
                tier2_excess = period_transactions - tier2
                variable_cost = (tier1_excess * rate1) + (tier2_excess * rate2)
                print(f"  Multi-tier excess:")
                print(f"    Tier 1 excess: {tier1_excess} × ${rate1:.4f} = ${tier1_excess * rate1:.2f}")
                print(f"    Tier 2 excess: {tier2_excess} × ${rate2:.4f} = ${tier2_excess * rate2:.2f}")
                print(f"    Total variable cost: ${variable_cost:.2f}")
            
            total_cost = base_cost + variable_cost
            print(f"  Total cost: ${base_cost:.2f} + ${variable_cost:.2f} = ${total_cost:.2f}")
            
            result = {
                'base_cost': base_cost,
                'variable_cost': variable_cost,
                'total_cost': total_cost,
                'transactions': period_transactions,
                'period_days': period_days,
                'license_tier': license_tier,
                'rate1': rate1,
                'rate2': rate2,
                'excess_transactions': excess_transactions,
                'tier1': tier1,
                'tier2': tier2,
                'config': config
            }
        
        print(f"=== PERIOD COST CALCULATION COMPLETE ===\n")
        return result

    def get_slab_config_period(self, period):
        """
        Get slab configuration for a specific period using the period's additional_cost.
        """
        print(f"🔍 Getting slab config for period {period['start_date']} to {period['end_date']}")
        
        # Check if period has additional_cost
        additional_cost = period.get('additional_cost')
        print(f"📋 Period additional_cost: {additional_cost}")
        print(f"📋 Type: {type(additional_cost)}")
        
        if additional_cost and isinstance(additional_cost, dict):
            print(f"✅ Period has additional_cost dict")
            print(f"📊 Discount keys found: {[k for k in additional_cost.keys() if 'discount' in k]}")
            
            # Check if it has discount configuration
            if any(key in additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                print("🎯 Found discount configuration keys")
                converted_config = self.convert_discount_to_tier_config(additional_cost)
                print(f"✅ Converted to tier config: {converted_config}")
                
                if converted_config:
                    print(f"🚀 Returning period-specific slab config")
                    return converted_config
                else:
                    print("❌ Conversion returned None")
            else:
                print("❌ No discount keys found in additional_cost")
        else:
            print("❌ Period has no additional_cost or it's not a dict")
        
        # Fallback to current client's additional_cost
        client = period.get('client')
        if client:
            client_additional_cost = getattr(client, 'additional_cost', None)
            print(f"🔄 Checking client fallback: {client_additional_cost}")
            
            if client_additional_cost and isinstance(client_additional_cost, dict):
                if any(key in client_additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                    converted_config = self.convert_discount_to_tier_config(client_additional_cost)
                    print(f"🔄 Using client slab config as fallback: {converted_config}")
                    return converted_config
        
        print("🚨 No slab config found for period, will use defaults")
        return None
    
    def get_client_email(self, client):
        """
        Get the email for a client by finding users with 'client' role
        associated with this client.
        """
        try:
            # Find users with this client foreign key and role='client'
            client_users = User.objects.filter(
                client=client,
                roles="client"
            )
            
            if client_users.exists():
                # Get the first client user's email
                client_user = client_users.first()
                client_email = client_user.mail
                print(f"Found client user with email: {client_email}")
                return client_email
            else:
                # Fallback: check if any user with this client has an email
                any_user = User.objects.filter(client=client).exclude(mail__isnull=True).exclude(mail__exact='').first()
                if any_user:
                    print(f"Using email from user with role '{any_user.roles}': {any_user.mail}")
                    return any_user.mail
                else:
                    print("No users found with email for this client")
                    return None
                    
        except Exception as e:
            print(f"Error getting client email: {str(e)}")
            return None
        
    def calculate_machine_costs_for_period(self, period, total_days_in_month):
        """
        Calculate machine costs for a specific period based on period machine counts
        Use client_vm_cost from ClientChangeLog ONLY for Virtual Machines (regular VMs)
        Use client_virtual_machine_cost from ClientChangeLog for Client Virtual Machines
        """
        period_days = period['days']
        
        # Default machine rates (using correct mapping)
        DEV_MACHINE_RATE = 200.00  # Fixed rate for dev_count
        PROD_MACHINE_RATE = 400.00  # Fixed rate for prod_count
        
        # Debug what's in the period
        print(f"🔍 DEBUG in calculate_machine_costs_for_period:")
        print(f"  - period.get('client_vm_cost'): {period.get('client_vm_cost')}")
        print(f"  - period.get('client_virtual_machine_cost'): {period.get('client_virtual_machine_cost')}")
        print(f"  - period.get('vm_count'): {period.get('vm_count')}")
        print(f"  - period.get('client_vm_count'): {period.get('client_vm_count')}")
        print(f"  - period.get('dev_vm_cost'): {period.get('dev_vm_cost')}")
        print(f"  - period.get('prod_vm_cost'): {period.get('prod_vm_cost')}")
        
        # Get Development VM rate - only use default if None
        dev_vm_cost_value = period.get('dev_vm_cost')
        if dev_vm_cost_value is None:
            DEV_VM_RATE = 200.00  # Default for dev_count
            print(f"ℹ️ Using default Dev VM rate (dev_vm_cost was None): ${DEV_VM_RATE:.2f}")
        else:
            try:
                DEV_VM_RATE = float(dev_vm_cost_value)
                print(f"✅ Using Dev VM rate from period data: ${DEV_VM_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting dev_vm_cost to float: {e}, using default")
                DEV_VM_RATE = 200.00
        
        # Get Production VM rate - only use default if None
        prod_vm_cost_value = period.get('prod_vm_cost')
        if prod_vm_cost_value is None:
            PROD_VM_RATE = 400.00  # Default for prod_count
            print(f"ℹ️ Using default Prod VM rate (prod_vm_cost was None): ${PROD_VM_RATE:.2f}")
        else:
            try:
                PROD_VM_RATE = float(prod_vm_cost_value)
                print(f"✅ Using Prod VM rate from period data: ${PROD_VM_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting prod_vm_cost to float: {e}, using default")
                PROD_VM_RATE = 400.00
        
        # Get VM rate from period (from client_vm_cost) - for vm_count
        # Only use default if None
        client_vm_cost_value = period.get('client_vm_cost')
        if client_vm_cost_value is None:
            VM_MACHINE_RATE = 300.00  # Default VM rate
            print(f"ℹ️ Using default VM rate (client_vm_cost was None): ${VM_MACHINE_RATE:.2f}")
        else:
            try:
                VM_MACHINE_RATE = float(client_vm_cost_value)
                print(f"✅ Using VM rate from period data (client_vm_cost): ${VM_MACHINE_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting client_vm_cost to float: {e}, using default")
                VM_MACHINE_RATE = 300.00
        
        # Get Client VM rate from period (from client_virtual_machine_cost) - for client_vm_count
        # Only use default if None
        client_virtual_machine_cost_value = period.get('client_virtual_machine_cost')
        if client_virtual_machine_cost_value is None:
            CLIENT_VM_RATE = 300.00  # Default Client VM rate
            print(f"ℹ️ Using default Client VM rate (client_virtual_machine_cost was None): ${CLIENT_VM_RATE:.2f}")
        else:
            try:
                CLIENT_VM_RATE = float(client_virtual_machine_cost_value)
                print(f"✅ Using Client VM rate from period data (client_virtual_machine_cost): ${CLIENT_VM_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting client_virtual_machine_cost to float: {e}, using default")
                CLIENT_VM_RATE = 300.00
        
        # Get machine counts for this period
        dev_count = period.get('dev_count', 0)
        prod_count = period.get('prod_count', 0)
        vm_count = period.get('vm_count', 0)  # This uses VM_MACHINE_RATE (client_vm_cost)
        client_vm_count = period.get('client_vm_count', 0)  # This uses CLIENT_VM_RATE (client_virtual_machine_cost)
        
        print(f"Calculating machine costs for period {period['start_date']} to {period['end_date']}:")
        print(f"  Dev: {dev_count}, Prod: {prod_count}, VM: {vm_count}, Client VM: {client_vm_count}")
        print(f"  Period days: {period_days}, Total month days: {total_days_in_month}")
        print(f"  Dev Rate: ${DEV_VM_RATE:.2f}/month, Prod Rate: ${PROD_VM_RATE:.2f}/month")
        print(f"  VM Rate: ${VM_MACHINE_RATE:.2f}/month, Client VM Rate: ${CLIENT_VM_RATE:.2f}/month")
        
        # Calculate monthly costs with correct mapping
        monthly_dev_cost = dev_count * DEV_VM_RATE
        monthly_prod_cost = prod_count * PROD_VM_RATE
        monthly_vm_cost = vm_count * VM_MACHINE_RATE  # vm_count uses client_vm_cost
        monthly_client_vm_cost = client_vm_count * CLIENT_VM_RATE  # client_vm_count uses client_virtual_machine_cost
        
        # Prorate based on days in period
        dev_cost = (monthly_dev_cost / total_days_in_month) * period_days
        prod_cost = (monthly_prod_cost / total_days_in_month) * period_days
        vm_cost = (monthly_vm_cost / total_days_in_month) * period_days
        client_vm_cost = (monthly_client_vm_cost / total_days_in_month) * period_days
        
        # Ensure we have float values (not Decimal)
        dev_cost = float(dev_cost)
        prod_cost = float(prod_cost)
        vm_cost = float(vm_cost)
        client_vm_cost = float(client_vm_cost)
        
        total_machine_cost = dev_cost + prod_cost + vm_cost + client_vm_cost
        
        print(f"  Monthly costs - Dev: ${monthly_dev_cost:.2f}, Prod: ${monthly_prod_cost:.2f}, VM: ${monthly_vm_cost:.2f}, Client VM: ${monthly_client_vm_cost:.2f}")
        print(f"  Prorated costs - Dev: ${dev_cost:.2f}, Prod: ${prod_cost:.2f}, VM: ${vm_cost:.2f}, Client VM: ${client_vm_cost:.2f}")
        print(f"  Total machine cost for period: ${total_machine_cost:.2f}")
        
        return {
            'dev_cost': dev_cost,
            'prod_cost': prod_cost,
            'vm_cost': vm_cost,
            'client_vm_cost': client_vm_cost,
            'total_machine_cost': total_machine_cost,
            'dev_count': dev_count,
            'prod_count': prod_count,
            'vm_count': vm_count,
            'client_vm_count': client_vm_count,
            'dev_rate': DEV_VM_RATE,           # Dynamic rate for dev machines (from dev_vm_cost)
            'prod_rate': PROD_VM_RATE,         # Dynamic rate for prod machines (from prod_vm_cost)
            'vm_rate': VM_MACHINE_RATE,        # Dynamic rate for VMs (from client_vm_cost)
            'client_vm_rate': CLIENT_VM_RATE   # Dynamic rate for Client VMs (from client_virtual_machine_cost)
        }

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        # --- Get client (using the new get_client method) ---
        client, error = self.get_client(request)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        # --- Get selected month ---
        selected_date_str = request.GET.get("selected_date")
        if not selected_date_str:
            return Response({"error": "Selected date is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            selected_date = parse(selected_date_str)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

        current_month = timezone.now().date().replace(day=1)
        selected_month = selected_date.replace(day=1).date()
        if selected_month >= current_month:
            return Response({"error": "Invoices can only be generated for previous months"}, status=status.HTTP_400_BAD_REQUEST)

        # --- Compute start and end date for the month ---
        import calendar
        start_date = selected_date.replace(day=1).date()    
        last_day = calendar.monthrange(selected_date.year, selected_date.month)[1]
        end_date = selected_date.replace(day=last_day).date()

        print(f"Generating invoice for client {client.client_name} (ID: {client.client_id}) for period {start_date} → {end_date}")

        # ==================================================
        # Fetch transaction count from External API
        # ==================================================
        external_api_url = "http://droidmetrix.droidal.com/get_client_trans_count"
        headers = {
            "Authorization": "Basic cXYwZmptNThmOTpibmQ4cmthbnNt",
            "Content-Type": "application/json",
        }
        
        client_mail = self.get_client_email(client)
        if not client_mail:
            return Response(
                {"error": "No email found for client. Please ensure at least one user with 'client' role is associated with this client."},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f"Using client email for external API: {client_mail}")
        
        params = {
            "client_name": client_mail,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }

        try:
            response = requests.get(external_api_url, headers=headers, params=params, timeout=20)
            print("External API response status:", response.status_code)
            if response.status_code != 200:
                return Response(
                    {"error": f"External API error: {response.status_code}", "details": response.text},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            transaction_data = response.json()
            print("Transaction data received:", transaction_data)
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to fetch transaction data: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        # ==================================================
        # Prepare transaction_counts dict
        # ==================================================
        transaction_counts = {item["date"]: int(item["total_transaction"]) for item in transaction_data}
        total_transactions = sum(transaction_counts.values())

        print(f"Total transactions: {total_transactions}")

        # ==================================================
        # Fetch API usage count from Database
        # ==================================================
        total_api_calls = self.get_api_usage_count(client, start_date, end_date)
        print(f"Total API calls from DB: {total_api_calls}")

        # ==================================================
        # Get tier periods and calculate costs
        # ==================================================
        tier_periods = self.get_tier_periods_for_month(client, start_date, end_date)
        total_days_in_month = (end_date - start_date).days + 1
        
        # Calculate costs for each period
        all_period_items = []
        total_base_cost = 0
        total_variable_cost = 0
        total_transaction_cost = 0
        total_machine_cost = 0
        total_dev_cost = 0
        total_prod_cost = 0
        total_vm_cost = 0
        total_client_vm_cost = 0

        for i, period in enumerate(tier_periods):
            # Calculate transaction costs for this period
            period_cost = self.calculate_period_cost(period, transaction_counts, total_days_in_month)
            
            # Calculate machine costs for this period
            machine_costs = self.calculate_machine_costs_for_period(period, total_days_in_month)
            
            period_items = []
            
            # Base license cost for this period
            if period_cost['base_cost'] > 0:
                period_items.append({
                    'description': f'Base License Cost ({period["license_tier"].title()}) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': 1,
                    'price': period_cost['base_cost'],
                    'total': period_cost['base_cost']
                })
            
            # Variable transaction cost for this period
            if period_cost['variable_cost'] > 0:
                if period["license_tier"] == 'lite':
                    period_items.append({
                        'description': f'Transaction Usage ({period_cost["transactions"]:,} transactions @ ${period_cost.get("rate", 0.01):.2f}/transaction)',
                        'quantity': period_cost['transactions'],
                        'price': period_cost.get('rate', 0.01),
                        'total': period_cost['variable_cost']
                    })
                else:
                    period_items.append({
                        'description': f'Variable Transaction Usage ({period_cost["excess_transactions"]:,} transactions @ ${period_cost.get("rate1", 0.07):.2f}/transaction)',
                        'quantity': period_cost['excess_transactions'],
                        'price': period_cost.get('rate1', 0.07),
                        'total': period_cost['variable_cost']
                    })
            
            # Machine costs for this period
            if machine_costs['dev_count'] > 0:
                dev_rate = machine_costs.get('dev_rate', 200.00)
                dev_cost_total = machine_costs['dev_cost']
                period_items.append({
                    'description': f'Development Machines ({machine_costs["dev_count"]} machines @ ${dev_rate:.2f}/machine) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': machine_costs['dev_count'],
                    'price': dev_rate,
                    'total': dev_cost_total
                })
                print(f"  Added Dev item: {machine_costs['dev_count']} machines @ ${dev_rate:.2f} = ${dev_cost_total:.2f}")

            if machine_costs['prod_count'] > 0:
                prod_rate = machine_costs.get('prod_rate', 400.00)
                prod_cost_total = machine_costs['prod_cost']
                period_items.append({
                    'description': f'Production Machines ({machine_costs["prod_count"]} machines @ ${prod_rate:.2f}/machine) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': machine_costs['prod_count'],
                    'price': prod_rate,
                    'total': prod_cost_total
                })
                print(f"  Added Prod item: {machine_costs['prod_count']} machines @ ${prod_rate:.2f} = ${prod_cost_total:.2f}")

            # Virtual Machines (vm_count uses client_vm_cost)
            # FIXED: Check for count > 0 instead of cost > 0
            if machine_costs['vm_count'] > 0:
                vm_rate = machine_costs.get('vm_rate', 300.00)
                vm_cost_total = machine_costs['vm_cost']
                period_items.append({
                    'description': f'Virtual Machines ({machine_costs["vm_count"]} VMs @ ${vm_rate:.2f}/VM) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': machine_costs['vm_count'],
                    'price': vm_rate,
                    'total': vm_cost_total
                })
                print(f"  Added VM item: {machine_costs['vm_count']} VMs @ ${vm_rate:.2f} = ${vm_cost_total:.2f}")

            # Client Virtual Machines (client_vm_count uses client_virtual_machine_cost)
            # FIXED: Check for count > 0 instead of cost > 0
            if machine_costs['client_vm_count'] > 0:
                client_vm_rate = machine_costs.get('client_vm_rate', 300.00)
                client_vm_cost_total = machine_costs['client_vm_cost']
                period_items.append({
                    'description': f'Client Virtual Machines ({machine_costs["client_vm_count"]} VMs @ ${client_vm_rate:.2f}/VM) - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': machine_costs['client_vm_count'],
                    'price': client_vm_rate,
                    'total': client_vm_cost_total
                })
                print(f"  Added Client VM item: {machine_costs['client_vm_count']} VMs @ ${client_vm_rate:.2f} = ${client_vm_cost_total:.2f}")
            
            # AI cost for this period
            ai_monthly_cost = 200.00
            full_calendar_days = total_days_in_month
            period_days = period['days']
            period_ai_cost = (ai_monthly_cost / full_calendar_days) * period_days
            
            if period_ai_cost > 0:
                period_items.append({
                    'description': f'AI Processing Cost - {period["start_date"].strftime("%b %d")} to {period["end_date"].strftime("%b %d")}',
                    'quantity': 1,
                    'price': period_ai_cost,
                    'total': period_ai_cost
                })
            
            # Period total (transaction + machine + AI costs)
            period_total = period_cost['total_cost'] + machine_costs['total_machine_cost'] + period_ai_cost
            
            all_period_items.append({
                'period_number': i + 1,
                'license_tier': period["license_tier"],
                'start_date': period["start_date"].isoformat() if hasattr(period["start_date"], 'isoformat') else str(period["start_date"]),
                'end_date': period["end_date"].isoformat() if hasattr(period["end_date"], 'isoformat') else str(period["end_date"]),
                'days': period["days"],
                'items': period_items,
                'period_total': period_total,
                'transactions': period_cost['transactions'],
                'base_cost': period_cost['base_cost'],
                'variable_cost': period_cost['variable_cost'],
                'machine_cost': machine_costs['total_machine_cost'],
                'dev_cost': machine_costs['dev_cost'],
                'prod_cost': machine_costs['prod_cost'],
                'vm_cost': machine_costs['vm_cost'],
                'client_vm_cost': machine_costs['client_vm_cost'],
                'ai_cost': period_ai_cost
            })
            
            total_base_cost += period_cost['base_cost']
            total_variable_cost += period_cost['variable_cost']
            total_transaction_cost += period_cost['total_cost']
            total_machine_cost += machine_costs['total_machine_cost']
            total_dev_cost += machine_costs['dev_cost']
            total_prod_cost += machine_costs['prod_cost']
            total_vm_cost += machine_costs['vm_cost']
            total_client_vm_cost += machine_costs['client_vm_cost']

        # ==================================================
        # CREATE OTHER COST ITEMS (API only - AI is already in period items)
        # ==================================================
        other_items = []

        # API cost
        api_cost = total_api_calls * 0.10 if total_api_calls > 0 else 0
        if api_cost > 0:
            other_items.append({
                'description': f'API Usage Cost ({total_api_calls:,} API calls)',
                'quantity': total_api_calls,
                'price': 0.10,
                'total': api_cost
            })

        # ==================================================
        # CALCULATE FINAL TOTALS CORRECTLY
        # ==================================================
        
        # Calculate total by summing all period totals
        total_period_costs = sum(period['period_total'] for period in all_period_items)
        other_costs_total = sum(item['total'] for item in other_items)  # This is only API cost
        
        # Final total should be sum of all period totals + API cost
        total = total_period_costs + other_costs_total
        
        # Subtotal should be the same as total since all costs are included
        sub_total = total

        print(f"=== FINAL TOTALS ===")
        print(f"Total period costs (transaction + machine + AI): ${total_period_costs:.2f}")
        print(f"API cost: ${other_costs_total:.2f}")
        print(f"Grand total: ${total:.2f}")
        print(f"====================")

        # ==================================================
        # PREPARE INVOICE DATA FOR JSON RESPONSE
        # ==================================================
        invoice_nr = f"INV-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        bill_to = client.client_name
        
        # Get client email
        bill_to_email = client_mail
        
        # Format dates
        invoice_date = timezone.now().strftime('%Y-%m-%d')
        payment_due = (timezone.now() + timezone.timedelta(days=30)).strftime('%Y-%m-%d')
        order_id = f"ORD-{selected_date.strftime('%Y%m')}"
        
        # Create billing period string
        billing_period = f"{start_date.strftime('%B %d, %Y')} - {end_date.strftime('%B %d, %Y')}"

        logo_base64 = None
        logo_path = os.path.join(settings.MEDIA_ROOT, 'droidal_logo_new.png')
        if os.path.exists(logo_path):
            try:
                with open(logo_path, 'rb') as f:
                    logo_data = base64.b64encode(f.read()).decode('utf-8')
                logo_base64 = f"data:image/png;base64,{logo_data}"
                print("Logo embedded as base64 successfully")
            except Exception as e:
                print(f"Error embedding logo: {e}")
        else:
            print(f"Logo file not found at {logo_path}") 

        # Convert tier periods to serializable format
        serializable_tier_periods = []
        for period in tier_periods:
            serializable_period = {
                'start_date': period['start_date'].isoformat() if hasattr(period['start_date'], 'isoformat') else str(period['start_date']),
                'end_date': period['end_date'].isoformat() if hasattr(period['end_date'], 'isoformat') else str(period['end_date']),
                'license_tier': period['license_tier'],
                'tier_cost': period['tier_cost'],
                'days': period['days'],
                'total_days_in_month': period['total_days_in_month'],
                'effective_date': period['effective_date'].isoformat() if period['effective_date'] and hasattr(period['effective_date'], 'isoformat') else str(period['effective_date']) if period['effective_date'] else None,
                'dev_count': period['dev_count'],
                'prod_count': period['prod_count'],
                'vm_count': period['vm_count'],
                'client_vm_count': period['client_vm_count']
            }
            serializable_tier_periods.append(serializable_period)

        # Prepare the response data - ensure all objects are JSON serializable
        response_data = {
            'html_content': {
                'invoice_nr': invoice_nr,
                'bill_to': bill_to,
                'bill_to_email': bill_to_email,
                'bill_to_address': getattr(client, "address", ""),  
                'bill_to_tax_id': getattr(client, "tax_id", ""),
                'invoice_date': invoice_date,
                'payment_due': payment_due,
                'order_id': order_id,
                'billing_period': billing_period,
                'period_items': all_period_items,
                'other_items': other_items,
                'sub_total': float(sub_total),
                'total': float(total),
                'client': {
                    'client_id': client.client_id,
                    'client_name': client.client_name,
                    'address': getattr(client, "address", ""),
                    'tax_id': getattr(client, "tax_id", "")
                },
                'selected_month': selected_date.strftime('%B %Y'),
                'total_transactions': int(total_transactions),
                'total_api_calls': int(total_api_calls),
                'tier_periods': serializable_tier_periods,
                # 'logo_base64': logo_base64,
                'total_machine_cost': float(total_machine_cost),
                'total_dev_cost': float(total_dev_cost),
                'total_prod_cost': float(total_prod_cost),
                'total_vm_cost': float(total_vm_cost),
                'total_client_vm_cost': float(total_client_vm_cost)
            },
            'invoice_nr': invoice_nr,
            'total': float(total),
            'client_id': client.client_id,
            'selected_date': selected_date_str,
            'status': 'success',
            'message': 'Invoice data generated successfully'
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
        # else:
        #     return Response({"error": "Error generating PDF"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def calculate_cost_breakdown(self, transaction_counts, license_tier, dev_count, prod_count, vm_count, total_api_calls, client, selected_date):
        import calendar
        from datetime import datetime, date, timedelta

        # Determine the month and number of days
        year, month = selected_date.year, selected_date.month
        days_in_month = calendar.monthrange(year, month)[1]
        
        month_start = date(year, month, 1)
        month_end = date(year, month, days_in_month)

        # Get tier periods for the month
        tier_periods = self.get_tier_periods_for_month(client, month_start, month_end)
        
        # Calculate costs for each period
        total_base_cost = 0
        total_variable_cost = 0
        total_transactions = 0
        period_breakdown = []

        for period in tier_periods:
            period_cost = self.calculate_period_cost(period, transaction_counts, days_in_month)
            total_base_cost += period_cost['base_cost']
            total_variable_cost += period_cost['variable_cost']
            total_transactions += period_cost['transactions']
            period_breakdown.append(period_cost)

        total_transaction_cost = total_base_cost + total_variable_cost

        # Calculate AI cost prorated by periods - FIXED: Use full calendar month days
        ai_monthly_cost = 200.00
        total_ai_cost = 0.00
        
        for period in tier_periods:
            period_days = period['days']
            # FIX: Use days_in_month (full calendar) instead of period adjusted days
            period_ai_cost = (ai_monthly_cost / days_in_month) * period_days
            total_ai_cost += period_ai_cost

        # Calculate excess transactions (for display purposes)
        # Use the first period's config for excess calculation
        first_period_config = self.build_tier_config(tier_periods[0]['license_tier'], None)
        tier1 = float(first_period_config.get('tier1', 0))
        excess_transactions = max(0, total_transactions - tier1)

        # Machine costs with new pricing
        dev_machine_cost = dev_count * 200.00 if dev_count > 0 else 0
        prod_machine_cost = prod_count * 400.00 if prod_count > 0 else 0
        vm_machine_cost = vm_count * 300.00 if vm_count > 0 else 0

        # API cost
        api_cost = total_api_calls * 0.10 if total_api_calls > 0 else 0

        # Build cost breakdown
        cost_breakdown = {
            'base_transaction_cost': round(total_base_cost, 2),
            'variable_transaction_cost': round(total_variable_cost, 2),
            'transaction_cost': round(total_transaction_cost, 2),
            'additional_trans_cost': round(total_variable_cost, 2),
            'dev_machine_cost': round(dev_machine_cost, 2),
            'prod_machine_cost': round(prod_machine_cost, 2),
            'vm_machine_cost': round(vm_machine_cost, 2),
            'api_cost': round(api_cost, 2),
            'ai_cost': round(total_ai_cost, 2),
            'days_with_transactions': len([count for count in transaction_counts.values() if count > 0]),
            'total_transactions': total_transactions,
            'excess_transactions': excess_transactions,
            'transaction_limit': tier1,
            'additional_rate': additional_rate,
            'tier_periods': tier_periods,
            'period_breakdown': period_breakdown,
        }

        return cost_breakdown
    

from datetime import datetime
import pytz
from django.db.models import Q

class UpdateClientPricesView(APIView):
    """Update client machine prices in change log based on period dates"""
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        client_id = request.data.get('client_id')
        prices_array = request.data.get('prices', [])
        
        print(f"\n{'='*60}")
        print(f"UPDATE CLIENT PRICES - DEBUG")
        print(f"{'='*60}")
        print(f"Client ID: {client_id}")
        print(f"Prices Array: {prices_array}")
        print(f"{'='*60}\n")
        
        if not client_id:
            return Response({"error": "Client ID is required"}, status=400)
        
        if not prices_array or not isinstance(prices_array, list):
            return Response({"error": "Prices array is required"}, status=400)
        
        try:
            client = Client.objects.get(client_id=client_id)
            print(f"✓ Client found: {client.client_name} ({client.client_id})\n")
            
            updated_logs = []
            
            for idx, price_item in enumerate(prices_array, 1):
                print(f"\n--- Processing Price Item #{idx} ---")
                
                field_name = price_item.get('field_name')
                new_price = price_item.get('price')
                start_date = price_item.get('start_date')
                end_date = price_item.get('end_date')
                
                print(f"Field Name: {field_name}")
                print(f"New Price: {new_price}")
                print(f"Start Date: {start_date}")
                print(f"End Date: {end_date}")
                
                if not all([field_name, new_price is not None, start_date, end_date]):
                    print("❌ Skipping - Missing required fields")
                    continue
                
                # Convert dates to datetime for comparison using pytz.UTC
                # Use date() to compare only the date portion, not the timestamp
                start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()
                
                print(f"Start Date (date only): {start_dt}")
                print(f"End Date (date only): {end_dt}")
                
                # Find the matching change log entry
                print(f"\nSearching for matching change log...")
                print(f"Criteria: effective_from.date <= {start_dt} AND (effective_to IS NULL OR effective_to.date >= {end_dt})")
                
                # Get all logs for this client and filter in Python for date comparison
                all_logs = ClientChangeLog.objects.filter(client=client).order_by('-effective_from')
                
                change_log = None
                for log in all_logs:
                    log_from_date = log.effective_from.date()
                    log_to_date = log.effective_to.date() if log.effective_to else None
                    
                    print(f"\nChecking Log ID {log.id}:")
                    print(f"  Log From Date: {log_from_date}")
                    print(f"  Log To Date: {log_to_date}")
                    
                    # Check if this log covers the period
                    # Log should start on or before the period start
                    # Log should end on or after the period end (or be active/NULL)
                    if log_from_date <= start_dt:
                        if log_to_date is None or log_to_date >= end_dt:
                            print(f"  ✓ Match found!")
                            change_log = log
                            break
                        else:
                            print(f"  ✗ Log ends before period ends ({log_to_date} < {end_dt})")
                    else:
                        print(f"  ✗ Log starts after period starts ({log_from_date} > {start_dt})")
                
                if not change_log:
                    print("❌ No matching change log found - Skipping")
                    
                    # Show all available logs for debugging
                    print(f"\nAvailable change logs for {client.client_name}:")
                    for log in all_logs:
                        print(f"  - ID: {log.id}, From: {log.effective_from}, To: {log.effective_to}")
                    continue
                
                print(f"\n✓ Found Change Log ID: {change_log.id}")
                print(f"  Effective From: {change_log.effective_from}")
                print(f"  Effective To: {change_log.effective_to}")
                
                # Get old value
                old_value = getattr(change_log, field_name, None)
                print(f"  Old {field_name}: {old_value}")
                
                # Update the price field in the change log
                if field_name == 'dev_vm_cost':
                    change_log.dev_vm_cost = float(new_price)
                elif field_name == 'prod_vm_cost':
                    change_log.prod_vm_cost = float(new_price)
                elif field_name == 'client_vm_cost':
                    change_log.client_vm_cost = float(new_price)
                elif field_name == 'client_virtual_machine_cost':
                    change_log.client_virtual_machine_cost = float(new_price)
                
                # Update edited_at timestamp
                change_log.edited_at = timezone.now()
                change_log.save()
                
                print(f"  New {field_name}: {float(new_price)}")
                print(f"✓ Successfully updated change log ID: {change_log.id}")
                
                updated_logs.append({
                    "log_id": change_log.id,
                    "field": field_name,
                    "old_value": float(old_value) if old_value else None,
                    "new_price": new_price,
                    "period": f"{start_date} to {end_date}",
                    "effective_from": change_log.effective_from.isoformat(),
                    "effective_to": change_log.effective_to.isoformat() if change_log.effective_to else None
                })
            
            print(f"\n{'='*60}")
            print(f"SUMMARY")
            print(f"{'='*60}")
            print(f"Total items processed: {len(prices_array)}")
            print(f"Successfully updated: {len(updated_logs)}")
            print(f"{'='*60}\n")
            
            if not updated_logs:
                return Response({
                    "error": "No matching change logs found for the specified periods"
                }, status=404)
            
            return Response({
                "message": "Prices updated successfully in change logs",
                "updated_logs": updated_logs,
                "client": {
                    "client_id": client.client_id,
                    "client_name": client.client_name
                }
            })
            
        except Client.DoesNotExist:
            print(f"❌ Client not found: {client_id}")
            return Response({"error": "Client not found"}, status=404)
        except Exception as e:
            import traceback
            print(f"\n{'='*60}")
            print(f"ERROR OCCURRED")
            print(f"{'='*60}")
            print(f"Error: {str(e)}")
            print(f"Traceback:\n{traceback.format_exc()}")
            print(f"{'='*60}\n")
            return Response({
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=500)

class AgentNamesAPIView(APIView):
    """
    An API view that returns a unique, sorted list of agent names (app_name).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            client = user.client
        except (AttributeError, ObjectDoesNotExist):
            return Response(
                {"error": "User does not have an associated client"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # The query to get the distinct agent names
        agent_names_queryset = (
            AgentTask.objects.filter(user__client=client)
            .values_list("apikey__app_name", flat=True)
            .distinct()
            .order_by("apikey__app_name")
        )

        response_data = {
            "agents": list(agent_names_queryset)
        }

        return Response(response_data, status=status.HTTP_200_OK)


from middleware.models import ClientApiUsage
from django.db.models import Sum
 
class ClientAgentTasksAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_slab_config(self, client):
        """
        Retrieve dynamic slab configuration from client's additional_cost field.
        """
        if client.additional_cost and isinstance(client.additional_cost, dict):
            additional_cost = client.additional_cost
            
            if any(key in additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                converted_config = self.convert_discount_to_tier_config(additional_cost)
                print(f"Converted slab config: {converted_config}")
                return converted_config
        
        return None

    def convert_discount_to_tier_config(self, discount_config):
        """
        Convert discount-based configuration to tier-based configuration.
        """
        tier_config = {}
        
        try:
            # Handle discount1_from (this becomes tier1)
            if 'discount1_from' in discount_config and discount_config['discount1_from'] is not None:
                try:
                    tier_config['tier1'] = float(discount_config['discount1_from'])
                except (TypeError, ValueError):
                    print("Invalid discount1_from value, skipping")
            
            # Handle discount_1 (this becomes rate1)
            if 'discount_1' in discount_config and discount_config['discount_1'] is not None:
                try:
                    tier_config['rate1'] = float(discount_config['discount_1'])
                except (TypeError, ValueError):
                    print("Invalid discount_1 value, skipping")
            
            # For single-tier pricing, set tier2 = tier1 and rate2 = rate1
            if 'tier1' in tier_config and 'rate1' in tier_config:
                tier_config['tier2'] = tier_config['tier1']
                tier_config['rate2'] = tier_config['rate1']
            
            tier_config = {k: v for k, v in tier_config.items() if v is not None}
            
        except Exception as e:
            print(f"Error converting discount config: {e}")
            return None
            
        return tier_config if tier_config else None

    def build_tier_config(self, license_tier, slab_config):
        """
        Build tier configuration based on license tier and slab config.
        """
        default_config = self.get_default_tier_config(license_tier)
        
        if not slab_config:
            print(f"Using default config for {license_tier}: {default_config}")
            return default_config
        
        try:
            merged_config = default_config.copy()
            
            for key in ['tier1', 'tier2', 'rate1', 'rate2']:
                if key in slab_config and slab_config[key] is not None:
                    try:
                        merged_config[key] = float(slab_config[key])
                    except (TypeError, ValueError):
                        print(f"Invalid {key} value in slab_config, using default: {slab_config[key]}")
            
            print(f"Final merged config for {license_tier}: {merged_config}")
            return merged_config
            
        except Exception as e:
            print(f"Error merging tier config: {e}")
            return default_config

    def get_default_tier_config(self, license_tier):
        """Get the default tier configuration for each license tier."""
        if license_tier == 'standard':
            return {
                'tier1': 25000.0,
                'tier2': 25000.0,  
                'rate1': 0.07,   
                'rate2': 0.07    
            }
        elif license_tier == 'pro':
            return {
                'tier1': 70000.0,  
                'tier2': 70000.0,  
                'rate1': 0.07,   
                'rate2': 0.07    
            }
        elif license_tier == 'enterprise':
            return {
                'tier1': 200000.0,  
                'tier2': 200000.0,  
                'rate1': 0.07,    
                'rate2': 0.07     
            }
        else:
            return {
                'tier1': 0.0,
                'tier2': 0.0,
                'rate1': 0.0,
                'rate2': 0.0
            }
        
    def get_tier_periods_for_date_range(self, client, start_date, end_date):
        """
        Get all tier periods that were active during the selected date range.
        CONSISTENT with other APIs - respect effective_date from ClientChangeLog.
        """
        # Get change logs that overlap with the selected date range
        change_logs = ClientChangeLog.objects.filter(
            client=client,
            effective_from__lte=end_date,
        ).exclude(
            effective_to__lt=start_date
        ).order_by('effective_from')
        
        periods = []
        total_days_in_range = (end_date - start_date).days + 1
        
        previous_end = start_date - timedelta(days=1)
        
        for log in change_logs:
            # Use effective_date from change log if available, otherwise use effective_from
            period_effective_date = None
            if log.effective_date:
                period_effective_date = log.effective_date.date()
                print(f"Using effective_date from change log: {period_effective_date}")
            elif log.effective_from:
                period_effective_date = log.effective_from.date()
                print(f"Using effective_from as effective_date: {period_effective_date}")
            else:
                # If no effective_date in log, use log's effective_from date
                period_effective_date = log.effective_from.date() if log.effective_from else start_date
                print(f"Using effective_from date as fallback: {period_effective_date}")
            
            # Adjust period start based on effective_date
            if period_effective_date:
                period_start = max(start_date, period_effective_date)
                print(f"Adjusted period_start considering effective_date: {period_start}")
            else:
                period_start = start_date
            
            # Avoid overlap with previous period
            if previous_end >= period_start:
                period_start = previous_end + timedelta(days=1)
            
            period_end = min(end_date, log.effective_to.date()) if log.effective_to else end_date
            
            # Only include periods that have at least one day
            if period_start <= period_end:
                tier_cost = self.get_tier_cost_for_period(log, client)
                
                # Get machine counts from change log
                dev_count = log.dev_count if log.dev_count is not None else client.dev_count
                prod_count = log.prod_count if log.prod_count is not None else client.prod_count
                vm_count = log.vm_count if log.vm_count is not None else client.vm_count
                client_vm_count = log.client_vm_count if log.client_vm_count is not None else client.client_vm_count
                
                # ✅ Get ALL cost fields from change log
                client_vm_cost = log.client_vm_cost if log.client_vm_cost is not None else client.client_vm_cost
                client_virtual_machine_cost = log.client_virtual_machine_cost if log.client_virtual_machine_cost is not None else client.client_virtual_machine_cost
                dev_vm_cost = log.dev_vm_cost if log.dev_vm_cost is not None else client.dev_vm_cost
                prod_vm_cost = log.prod_vm_cost if log.prod_vm_cost is not None else client.prod_vm_cost
                
                periods.append({
                    'start_date': period_start,
                    'end_date': period_end,
                    'license_tier': log.license_tier,
                    'tier_cost': tier_cost,
                    'additional_cost': log.additional_cost,
                    'days': (period_end - period_start).days + 1,
                    'total_days_in_range': total_days_in_range,
                    'client': client,
                    'effective_date': period_effective_date,
                    # Include machine counts for this period
                    'dev_count': dev_count,
                    'prod_count': prod_count,
                    'vm_count': vm_count,
                    'client_vm_count': client_vm_count,
                    # ✅ ADDED: Include ALL cost fields from change log
                    'client_vm_cost': client_vm_cost,  # For regular VMs (vm_count)
                    'client_virtual_machine_cost': client_virtual_machine_cost,  # For client VMs (client_vm_count)
                    'dev_vm_cost': dev_vm_cost,  # For dev machines
                    'prod_vm_cost': prod_vm_cost,  # For prod machines
                })
                
                previous_end = period_end
        
        # If no change logs found, create a single period for the entire date range
        if not periods:
            # Use start_date as effective_date when no logs exist
            effective_date = start_date
            
            tier_cost = self.get_tier_cost_for_period(None, client)
            
            periods.append({
                'start_date': effective_date,  # Use start_date as effective_date
                'end_date': end_date,
                'license_tier': client.license_tier,
                'tier_cost': tier_cost,
                'additional_cost': client.additional_cost,
                'days': (end_date - effective_date).days + 1,
                'total_days_in_range': total_days_in_range,
                'client': client,
                'effective_date': effective_date,
                # Use current client machine counts
                'dev_count': client.dev_count,
                'prod_count': client.prod_count,
                'vm_count': client.vm_count,
                'client_vm_count': client.client_vm_count,
                # ✅ ADDED: Include ALL cost fields from client table
                'client_vm_cost': client.client_vm_cost,  # For regular VMs
                'client_virtual_machine_cost': client.client_virtual_machine_cost,  # For client VMs
                'dev_vm_cost': client.dev_vm_cost,  # For dev machines
                'prod_vm_cost': client.prod_vm_cost,  # For prod machines
            })
        
        print(f"Found {len(periods)} periods for date range {start_date} to {end_date}")
        for i, period in enumerate(periods):
            print(f"Period {i+1}: {period['license_tier']} from {period['start_date']} to {period['end_date']} ({period['days']} days)")
            print(f"  Effective Date: {period.get('effective_date', 'Not set')}")
            print(f"  Machine Counts - Dev: {period['dev_count']}, Prod: {period['prod_count']}, VM: {period['vm_count']}, Client VM: {period['client_vm_count']}")
            print(f"  Cost Rates - client_vm_cost: ${period.get('client_vm_cost', 'Not set')}, client_virtual_machine_cost: ${period.get('client_virtual_machine_cost', 'Not set')}")
            print(f"                dev_vm_cost: ${period.get('dev_vm_cost', 'Not set')}, prod_vm_cost: ${period.get('prod_vm_cost', 'Not set')}")
        
        return periods
    
    def get_tier_cost_for_period(self, change_log, client):
        """
        Get the correct tier cost for a period.
        Consistent with other APIs.
        """
        if change_log and change_log.tier_cost is not None:
            return float(change_log.tier_cost)
        elif client.tier_cost is not None:
            return float(client.tier_cost)
        else:
            # Fallback to default tier costs - SAME AS OTHER APIS
            base_cost_map = {'lite': 600, 'standard': 3500, 'pro': 10500, 'enterprise': 22500}
            license_tier = change_log.license_tier if change_log else client.license_tier
            return base_cost_map.get(license_tier, 0)
    
    def get_api_usage_count(self, client, start_date, end_date):
        """
        Fetch API usage count from ClientApiUsage table for the given client and date range.
        Consistent with other APIs.
        """
        try:
            # Get all API keys associated with this client's users
            user_api_keys = Agent_API_SecretKeyss.objects.filter(
                user__client=client
            ).values_list('api_key', flat=True)
            
            # Sum the count from ClientApiUsage for these API keys in the date range
            api_usage = ClientApiUsage.objects.filter(
                apikey__api_key__in=user_api_keys,
                date__gte=start_date,
                date__lte=end_date
            ).aggregate(total_count=Sum('count'))
            
            total_api_calls = api_usage['total_count'] or 0
            print(f"Total API calls from DB for client {client.client_name}: {total_api_calls}")
            
            return total_api_calls
            
        except Exception as e:
            print(f"Error fetching API usage from DB: {e}")
            return 0
        
    def calculate_machine_costs_for_period(self, period, total_days_in_range):
        """
        Calculate machine costs for a specific period based on period machine counts
        Use dynamic rates from ClientChangeLog for ALL machine types
        """
        period_days = period['days']
        
        # Debug what's in the period
        print(f"🔍 DEBUG in calculate_machine_costs_for_period:")
        print(f"  - period.get('client_vm_cost'): {period.get('client_vm_cost')}")
        print(f"  - period.get('client_virtual_machine_cost'): {period.get('client_virtual_machine_cost')}")
        print(f"  - period.get('dev_vm_cost'): {period.get('dev_vm_cost')}")
        print(f"  - period.get('prod_vm_cost'): {period.get('prod_vm_cost')}")
        
        # Get DEV machine rate from period (from ClientChangeLog)
        # FIXED: Only use default if value is None, not if it's 0.00
        dev_vm_cost_value = period.get('dev_vm_cost')
        if dev_vm_cost_value is None:
            DEV_MACHINE_RATE = 200.00  # Default for dev_count
            print(f"ℹ️ Using default DEV rate (dev_vm_cost was None): ${DEV_MACHINE_RATE:.2f}")
        else:
            try:
                DEV_MACHINE_RATE = float(dev_vm_cost_value)
                print(f"✅ Using DEV rate from period data (dev_vm_cost): ${DEV_MACHINE_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting dev_vm_cost to float: {e}, using default 200.00")
                DEV_MACHINE_RATE = 200.00
        
        # Get PROD machine rate from period (from ClientChangeLog)
        # FIXED: Only use default if value is None, not if it's 0.00
        prod_vm_cost_value = period.get('prod_vm_cost')
        if prod_vm_cost_value is None:
            PROD_MACHINE_RATE = 400.00  # Default for prod_count
            print(f"ℹ️ Using default PROD rate (prod_vm_cost was None): ${PROD_MACHINE_RATE:.2f}")
        else:
            try:
                PROD_MACHINE_RATE = float(prod_vm_cost_value)
                print(f"✅ Using PROD rate from period data (prod_vm_cost): ${PROD_MACHINE_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting prod_vm_cost to float: {e}, using default 400.00")
                PROD_MACHINE_RATE = 400.00
        
        # Get VM rate from period (from ClientChangeLog) - for regular VMs (vm_count)
        # FIXED: Only use default if value is None, not if it's 0.00
        client_vm_cost_value = period.get('client_vm_cost')
        if client_vm_cost_value is None:
            VM_MACHINE_RATE = 300.00  # Default VM rate
            print(f"ℹ️ Using default VM rate (client_vm_cost was None): ${VM_MACHINE_RATE:.2f}")
        else:
            try:
                VM_MACHINE_RATE = float(client_vm_cost_value)
                print(f"✅ Using VM rate from period data (client_vm_cost): ${VM_MACHINE_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting client_vm_cost to float: {e}, using default 300.00")
                VM_MACHINE_RATE = 300.00
        
        # Get Client VM rate from period (from ClientChangeLog) - for client VMs (client_vm_count)
        # FIXED: Only use default if value is None, not if it's 0.00
        client_virtual_machine_cost_value = period.get('client_virtual_machine_cost')
        if client_virtual_machine_cost_value is None:
            CLIENT_VM_RATE = 300.00  # Default Client VM rate
            print(f"ℹ️ Using default Client VM rate (client_virtual_machine_cost was None): ${CLIENT_VM_RATE:.2f}")
        else:
            try:
                CLIENT_VM_RATE = float(client_virtual_machine_cost_value)
                print(f"✅ Using Client VM rate from period data (client_virtual_machine_cost): ${CLIENT_VM_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting client_virtual_machine_cost to float: {e}, using default 300.00")
                CLIENT_VM_RATE = 300.00
        
        # Get machine counts for this period
        dev_count = period.get('dev_count', 0)
        prod_count = period.get('prod_count', 0)
        vm_count = period.get('vm_count', 0)
        client_vm_count = period.get('client_vm_count', 0)
        
        print(f"Calculating machine costs for period {period['start_date']} to {period['end_date']}:")
        print(f"  Dev: {dev_count}, Prod: {prod_count}, VM: {vm_count}, Client VM: {client_vm_count}")
        print(f"  Period days: {period_days}, Total days in range: {total_days_in_range}")
        print(f"  Dev Rate: ${DEV_MACHINE_RATE:.2f}/month")
        print(f"  Prod Rate: ${PROD_MACHINE_RATE:.2f}/month")
        print(f"  VM Rate (regular VMs): ${VM_MACHINE_RATE:.2f}/month")
        print(f"  Client VM Rate: ${CLIENT_VM_RATE:.2f}/month")
        
        # Calculate monthly costs with dynamic rates
        monthly_dev_cost = dev_count * DEV_MACHINE_RATE
        monthly_prod_cost = prod_count * PROD_MACHINE_RATE
        monthly_vm_cost = vm_count * VM_MACHINE_RATE  # Uses client_vm_cost from DB
        monthly_client_vm_cost = client_vm_count * CLIENT_VM_RATE  # Uses client_virtual_machine_cost from DB
        
        # Prorate based on days in period
        dev_cost = (monthly_dev_cost / total_days_in_range) * period_days
        prod_cost = (monthly_prod_cost / total_days_in_range) * period_days
        vm_cost = (monthly_vm_cost / total_days_in_range) * period_days
        client_vm_cost = (monthly_client_vm_cost / total_days_in_range) * period_days
        
        # Ensure we have float values (not Decimal)
        dev_cost = float(dev_cost)
        prod_cost = float(prod_cost)
        vm_cost = float(vm_cost)
        client_vm_cost = float(client_vm_cost)
        
        total_machine_cost = dev_cost + prod_cost + vm_cost + client_vm_cost
        
        print(f"  Monthly costs - Dev: ${monthly_dev_cost:.2f}, Prod: ${monthly_prod_cost:.2f}, VM: ${monthly_vm_cost:.2f}, Client VM: ${monthly_client_vm_cost:.2f}")
        print(f"  Prorated costs - Dev: ${dev_cost:.2f}, Prod: ${prod_cost:.2f}, VM: ${vm_cost:.2f}, Client VM: ${client_vm_cost:.2f}")
        print(f"  Total machine cost for period: ${total_machine_cost:.2f}")
        
        return {
            'dev_cost': dev_cost,
            'prod_cost': prod_cost,
            'vm_cost': vm_cost,
            'client_vm_cost': client_vm_cost,
            'total_machine_cost': total_machine_cost,
            'dev_count': dev_count,
            'prod_count': prod_count,
            'vm_count': vm_count,
            'client_vm_count': client_vm_count,
            'dev_rate': DEV_MACHINE_RATE,           # Dynamic rate for dev machines
            'prod_rate': PROD_MACHINE_RATE,         # Dynamic rate for prod machines
            'vm_rate': VM_MACHINE_RATE,             # Dynamic rate for regular VMs
            'client_vm_rate': CLIENT_VM_RATE        # Dynamic rate for client VMs
        }

    def calculate_daily_costs_for_graph(self, transaction_counts, client, start_date, end_date, effective_date=None):
        """
        Calculate daily costs for graph display - Use EXACT same logic as other APIs.
        Now includes AI cost and proper effective date handling.
        """
        from datetime import timedelta
        
        days_count = (end_date - start_date).days + 1
        all_days_in_range = [(start_date + timedelta(days=i)).isoformat() for i in range(days_count)]
        
        # Get tier periods for the date range (with proper effective_date adjustment)
        tier_periods = self.get_tier_periods_for_date_range(client, start_date, end_date)
        
        # Get total API usage for the entire period
        total_api_calls = self.get_api_usage_count(client, start_date, end_date)
        
        # FIXED: Use same AI cost calculation as other APIs
        monthly_ai_cost = 200.00
        monthly_api_cost = total_api_calls * 0.10 if total_api_calls > 0 else 0
        
        # Total days in the full period (for proration)
        total_days_in_period = (end_date - start_date).days + 1
        print(f"Total days in period: {total_days_in_period}")
        
        costs_per_day = {}
        
        for period in tier_periods:
            period_start = period['start_date']
            period_end = period['end_date']
            license_tier = period['license_tier']
            monthly_tier_cost = period['tier_cost']
            period_days = period['days']
            
            # FIXED: Calculate AI cost for this period (same as other APIs)
            period_ai_cost = (monthly_ai_cost / total_days_in_period) * period_days
            
            # FIXED: Calculate API cost for this period
            period_api_calls = self.get_api_usage_count(client, period_start, period_end)
            period_api_cost = period_api_calls * 0.10
            
            # FIXED: Calculate machine costs for this period
            machine_costs = self.calculate_machine_costs_for_period(period, total_days_in_period)
            total_machine_cost_for_period = machine_costs['total_machine_cost']
            
            # FIXED: Use total_days_in_period for base cost calculation (same as other APIs)
            period_base_cost = (monthly_tier_cost / total_days_in_period) * period_days
            
            # Daily base license cost
            daily_base_license_cost = period_base_cost / period_days if period_days > 0 else 0
            
            # FIXED: Daily other costs (AI + API + Machine) - prorated by period days
            daily_other_costs = (period_ai_cost + period_api_cost + total_machine_cost_for_period) / period_days if period_days > 0 else 0
            
            # Get period-specific slab configuration
            slab_config = self.get_slab_config_period(period)
            config = self.build_tier_config(license_tier, slab_config)
            
            # Calculate total transactions for this period (respecting effective_date)
            period_transactions = 0
            for i in range((period_end - period_start).days + 1):
                current_day = period_start + timedelta(days=i)
                day_str = current_day.isoformat()
                
                # Count transactions only if after effective date
                period_effective_date = period.get('effective_date')
                if period_effective_date and current_day < period_effective_date:
                    continue
                    
                period_transactions += transaction_counts.get(day_str, 0)
            
            # Calculate variable cost for the ENTIRE period (same as other APIs)
            tier1 = float(config.get('tier1', 0))
            tier2 = float(config.get('tier2', tier1))
            rate1 = float(config.get('rate1', 0.07))
            rate2 = float(config.get('rate2', rate1))
            
            # Calculate variable cost for the period
            if period_transactions <= tier1:
                period_variable_cost = 0
            elif tier1 == tier2:
                period_variable_cost = (period_transactions - tier1) * rate1
            elif period_transactions <= tier2:
                period_variable_cost = (period_transactions - tier1) * rate1
            else:
                tier1_excess = tier2 - tier1
                tier2_excess = period_transactions - tier2
                period_variable_cost = (tier1_excess * rate1) + (tier2_excess * rate2)
            
            # Daily variable cost
            daily_variable_cost = period_variable_cost / period_days if period_days > 0 else 0
            
            print(f"=== PERIOD {period_start} to {period_end} ===")
            print(f"Period base cost: ${period_base_cost:.2f}")
            print(f"Period AI cost: ${period_ai_cost:.2f}")
            print(f"Period API cost: ${period_api_cost:.2f}")
            print(f"Period machine cost: ${total_machine_cost_for_period:.2f}")
            print(f"Period variable cost: ${period_variable_cost:.2f}")
            print(f"Daily base: ${daily_base_license_cost:.2f}, Daily other: ${daily_other_costs:.2f}, Daily variable: ${daily_variable_cost:.2f}")
            
            # Assign costs to each day in the period
            for i in range((period_end - period_start).days + 1):
                current_day = period_start + timedelta(days=i)
                day_str = current_day.isoformat()
                
                # If before period's effective date, cost is 0
                period_effective_date = period.get('effective_date')
                if period_effective_date and current_day < period_effective_date:
                    costs_per_day[day_str] = 0.0
                    continue
                
                day_count = transaction_counts.get(day_str, 0)
                
                # Total daily cost = base license + variable + other costs (AI + API + Machine)
                total_daily_cost = daily_base_license_cost + daily_variable_cost + daily_other_costs
                costs_per_day[day_str] = round(total_daily_cost, 2)
                
                print(f"Chart cost for {day_str}: {costs_per_day[day_str]} (transactions: {day_count})")
        
        # Fill missing days with 0
        for day in all_days_in_range:
            if day not in costs_per_day:
                costs_per_day[day] = 0.0
        
        # Calculate and print total for verification
        total_chart_cost = sum(costs_per_day.values())
        print(f"TOTAL CHART COST: ${total_chart_cost:.2f}")
        
        return costs_per_day
    
    def get_slab_config_period(self, period):
        """
        Get slab configuration for a specific period.
        CONSISTENT WITH OTHER APIS - Use period-specific config first, then client fallback.
        """
        print(f"🔍 Getting slab config for period {period['start_date']} to {period['end_date']}")
        
        # Check if period has additional_cost with discount configuration
        additional_cost = period.get('additional_cost')
        if additional_cost and isinstance(additional_cost, dict):
            # Check if it has discount configuration keys
            discount_keys = ['discount_1', 'discount1_from', 'discount1_to']
            if any(key in additional_cost for key in discount_keys):
                print("🎯 Found discount configuration in period additional_cost")
                converted_config = self.convert_discount_to_tier_config(additional_cost)
                if converted_config:
                    print(f"✅ Returning period-specific slab config: {converted_config}")
                    return converted_config
        
        # Check client's additional_cost as fallback
        client = period.get('client')
        if client:
            client_additional_cost = getattr(client, 'additional_cost', None)
            if client_additional_cost and isinstance(client_additional_cost, dict):
                discount_keys = ['discount_1', 'discount1_from', 'discount1_to']
                if any(key in client_additional_cost for key in discount_keys):
                    converted_config = self.convert_discount_to_tier_config(client_additional_cost)
                    if converted_config:
                        print(f"🔄 Using client slab config as fallback: {converted_config}")
                        return converted_config
        
        print("🚨 No slab config found for period, will use defaults")
        return None

    def get(self, request):
        """
        Handle GET requests for client agent tasks and billing data
        """
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            client = user.client
            if client is None:
                return Response({"error": "User does not have an associated client"}, status=status.HTTP_400_BAD_REQUEST)
        except AttributeError:
            return Response({"error": "User does not have an associated client"}, status=status.HTTP_400_BAD_REQUEST)

        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")
        today = timezone.now().date()
        
        # Parse dates or use current month as default
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        else:
            start_date = today.replace(day=1)
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_date = today.replace(day=last_day)

        # Get client's effective date
        effective_date = getattr(client, "effective_date", None)
        if effective_date:
            effective_date = effective_date.date()

        # Use client's mail/email for external API
        client_mail = getattr(client, "mail", None) or getattr(user, "mail", None) or getattr(user, "email", None)
        license_tier = getattr(client, "license_tier", "standard")

        # Get dynamic slab configuration
        slab_config = self.get_slab_config(client)
        print(f"Client additional_cost: {getattr(client, 'additional_cost', None)}")
        print(f"Processed slab_config: {slab_config}")
        print(f"Effective Date: {effective_date}")

        # Fetch transaction count from external API
        external_api_url = "http://droidmetrix.droidal.com/get_client_trans_count"
        headers = {
            "Authorization": "Basic cXYwZmptNThmOTpibmQ4cmthbnNt",
            "Content-Type": "application/json",
        }
        params = {
            "client_name": client_mail,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }
        
        try:
            response = requests.get(external_api_url, headers=headers, params=params, timeout=20)
            if response.status_code != 200:
                return Response({"error": f"External API error: {response.status_code}", "details": response.text}, status=status.HTTP_502_BAD_GATEWAY)
            transaction_data = response.json()
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to fetch transaction data: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        transaction_counts = {item["date"]: int(item["total_transaction"]) for item in transaction_data}

        # Calculate costs for graph using the new method
        cost_per_day = self.calculate_daily_costs_for_graph(
            transaction_counts, client, start_date, end_date, effective_date
        )

        # Fetch raw tasks data
        tasks_data = self.get_raw_tasks_data(client_mail, start_date, end_date)
        grouped_transactions = self.group_transactions_bulk(tasks_data, cost_per_day, license_tier)

        # Prepare graph data
        graph_data = [
            {
                "date": date, 
                "transaction_count": count, 
                "cost": cost_per_day.get(date, 0),
                "cumulative_cost": 0  # Will calculate below
            }
            for date, count in sorted(transaction_counts.items())
        ]

        # Calculate cumulative costs for license cost data
        today_str = today.isoformat()
        sorted_dates = sorted([d for d in cost_per_day.keys() if d <= today_str])
        license_cost_data = []
        running_total = 0.0
        
        for date in sorted_dates:
            daily_cost = cost_per_day.get(date, 0)
            running_total += daily_cost
            license_cost_data.append({
                "date": date,
                "transaction_count": transaction_counts.get(date, 0),
                "cost": round(running_total, 2),
            })

        # Update graph data with cumulative costs
        cumulative_running = 0.0
        for item in graph_data:
            cumulative_running += item['cost']
            item['cumulative_cost'] = round(cumulative_running, 2)

        # Threshold excess calculations
        total_transactions = 0
        tier_periods = self.get_tier_periods_for_date_range(client, start_date, end_date)
        
        # Calculate total transactions using the same period logic as cost calculation
        for period in tier_periods:
            period_start = period['start_date']
            period_end = period['end_date']
            period_effective_date = period.get('effective_date')
            
            for i in range((period_end - period_start).days + 1):
                current_day = period_start + timedelta(days=i)
                day_str = current_day.isoformat()
                
                # Only count transactions if after period's effective date
                if period_effective_date and current_day < period_effective_date:
                    continue
                    
                total_transactions += transaction_counts.get(day_str, 0)
            
        config = self.build_tier_config(license_tier, slab_config)
        tier1, rate1 = config['tier1'], config['rate1']
        exceeded_transactions = max(0, total_transactions - tier1)
        exceeded_amount = round(exceeded_transactions * rate1, 2)

        # Respond with billing data
        return Response({
            "client_name": client.client_name,
            "license_tier": license_tier,
            "effective_date": effective_date.isoformat() if effective_date else None,
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
            "graph_data": graph_data,
            "license_cost": license_cost_data,
            "transaction_counts": transaction_counts,
            "transactionsgrouped": grouped_transactions,
            "threshold_exceeded": exceeded_transactions > 0,
            "exceeded_transactions": exceeded_transactions,
            "exceeded_amount": exceeded_amount,
            "tier_config": config,  # Include for debugging
        }, status=200)

    def get_raw_tasks_data(self, client_mail, start_date, end_date):
        """
        Implement actual DB query for your model
        This should return a list of task dictionaries with required fields
        """
        # TODO: Replace with your actual database query
        # Example:
        # return YourTaskModel.objects.filter(
        #     client_mail=client_mail,
        #     created_at__range=[start_date, end_date]
        # ).values('created_at', 'apikey__module__module_name', 'apikey__app_name')
        return []

    def calculate_daily_costs_with_threshold(self, transaction_counts, license_tier, start_date, end_date, slab_config, effective_date=None):
        from datetime import timedelta
        import calendar
        
        days_count = (end_date - start_date).days + 1
        all_days_in_range = [(start_date + timedelta(days=i)).isoformat() for i in range(days_count)]
        base_cost_map = {'lite': 600, 'standard': 3500, 'pro': 10500, 'enterprise': 22500}
        base_cost = base_cost_map.get(license_tier, 0)
        
        # Calculate base cost per day based on total days in the month
        days_in_month = calendar.monthrange(start_date.year, start_date.month)[1]
        base_per_day = base_cost / days_in_month if days_in_month > 0 else 0
        
        # Build dynamic tier config with safety
        config = self.build_tier_config(license_tier, slab_config)
        
        # SAFETY: Ensure all values are valid numbers with explicit defaults
        tier1 = float(config.get('tier1', 0))
        tier2 = float(config.get('tier2', tier1))  # Default to same as tier1
        rate1 = float(config.get('rate1', 0.07))
        rate2 = float(config.get('rate2', rate1))  # Default to same as rate1
        
        print(f"Calculation values - tier1: {tier1} (type: {type(tier1)}), tier2: {tier2} (type: {type(tier2)}), rate1: {rate1}, rate2: {rate2}")
        print(f"Effective date for cost calculation: {effective_date}")
        
        costs_per_day = {}
        cumulative_txn = 0
        
        for day in all_days_in_range:
            day_obj = datetime.strptime(day, "%Y-%m-%d").date()
            
            # If effective_date is set and current day is before effective_date, cost is 0
            if effective_date and day_obj < effective_date:
                costs_per_day[day] = 0.0
                print(f"Zero cost for {day} (before effective date)")
                continue
                
            day_count = transaction_counts.get(day, 0)
            daily_variable_cost = 0.0
            
            for _ in range(day_count):
                cumulative_txn += 1
                # SAFETY: All values are now guaranteed to be numbers
                if cumulative_txn <= tier1:
                    continue  # Included in base cost
                elif cumulative_txn <= tier2:
                    daily_variable_cost += rate1
                else:
                    daily_variable_cost += rate2
                    
            costs_per_day[day] = round(base_per_day + daily_variable_cost, 2)
            print(f"Calculated cost for {day}: {costs_per_day[day]} (transactions: {day_count})")
            
        return costs_per_day

    def calculate_license_costs(self, transaction_counts, license_tier, start_date, end_date, slab_config, effective_date=None):
        from datetime import timedelta
        
        days_count = (end_date - start_date).days + 1
        all_days_in_range = [(start_date + timedelta(days=i)).isoformat() for i in range(days_count)]
        base_cost_map = {'lite': 600, 'standard': 3500, 'pro': 10500, 'enterprise': 22500}
        base_cost = base_cost_map.get(license_tier, 0)
        base_per_day = base_cost / days_count if days_count else 0
        
        # Build dynamic tier config with safety
        config = self.build_tier_config(license_tier, slab_config)
        
        # SAFETY: Ensure all values are valid numbers with explicit defaults
        tier1 = float(config.get('tier1', 0))
        tier2 = float(config.get('tier2', tier1))  # Default to same as tier1
        rate1 = float(config.get('rate1', 0.07))
        rate2 = float(config.get('rate2', rate1))  # Default to same as rate1
        
        costs_per_day = {}
        cumulative_txn = 0
        
        for day in all_days_in_range:
            day_obj = datetime.strptime(day, "%Y-%m-%d").date()
            
            # If effective_date is set and current day is before effective_date, cost is 0
            if effective_date and day_obj < effective_date:
                costs_per_day[day] = 0.0
                continue
                
            # Set base cost for days on or after effective_date
            costs_per_day[day] = base_per_day
            day_count = transaction_counts.get(day, 0)
            daily_variable_cost = 0.0
            
            for _ in range(day_count):
                cumulative_txn += 1
                # SAFETY: All values are now guaranteed to be numbers
                if cumulative_txn <= tier1:
                    continue  # Included in base cost
                elif cumulative_txn <= tier2:
                    daily_variable_cost += rate1
                else:
                    daily_variable_cost += rate2
                    
            costs_per_day[day] = round(costs_per_day[day] + daily_variable_cost, 2)
            
        return costs_per_day

    def group_transactions_bulk(self, tasks_data, cost_per_day, license_tier):
        from datetime import datetime, timedelta
        from collections import defaultdict
        daily_agg = defaultdict(lambda: defaultdict(lambda: {"transaction_count": 0, "cost": 0}))
        daily_transaction_counts = defaultdict(int)
        
        for task in tasks_data:
            date_str = task['created_at'].date().isoformat()
            module = task['apikey__module__module_name']
            app = task['apikey__app_name']
            daily_agg[date_str][(module, app)]["transaction_count"] += 1
            daily_transaction_counts[date_str] += 1
            
        for date_str in daily_agg:
            total_daily_cost = cost_per_day.get(date_str, 0)
            total_transactions_on_day = daily_transaction_counts[date_str]
            cost_per_transaction = total_daily_cost / total_transactions_on_day if total_transactions_on_day > 0 else 0.0
            
            for (module, app), val in daily_agg[date_str].items():
                group_txn_count = val["transaction_count"]
                val["cost"] = round(group_txn_count * cost_per_transaction, 2)
                
        sorted_items = sorted(
            [
                {
                    "date": date_str,
                    "module_name": module,
                    "app_name": app,
                    "transaction_count": val["transaction_count"],
                    "cost": val["cost"]
                }
                for date_str in sorted(daily_agg)
                for (module, app), val in daily_agg[date_str].items()
            ],
            key=lambda x: (x["module_name"], x["app_name"], x["date"])
        )
        
        grouped = []
        current_group = None
        
        for item in sorted_items:
            date_obj = datetime.fromisoformat(item["date"]).date()
            if (current_group is None or
                item["module_name"] != current_group["module_name"] or
                item["app_name"] != current_group["app_name"] or
                date_obj != datetime.fromisoformat(current_group["end_date"]).date() + timedelta(days=1)):
                if current_group:
                    grouped.append(current_group)
                current_group = {
                    "start_date": item["date"],
                    "end_date": item["date"],
                    "module_name": item["module_name"],
                    "app_name": item["app_name"],
                    "transaction_count": item["transaction_count"],
                    "cost": item["cost"]
                }
            else:
                current_group["end_date"] = item["date"]
                current_group["transaction_count"] += item["transaction_count"]
                current_group["cost"] = round(current_group["cost"] + item["cost"], 2)
                
        if current_group:
            grouped.append(current_group)
            
        return grouped


class AgentNamesAPIView(APIView):
    """
    An API view that returns a unique, sorted list of agent names (app_name).
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        user = request.user
        try:
            client = user.client
        except (AttributeError, ObjectDoesNotExist):
            return Response({"error": "User does not have an associated client"}, status=status.HTTP_400_BAD_REQUEST)
 
        # Query the AgentTask model for distinct app_names that belong to the user's client
        # and are not in the non-agent module list.
        agent_names = AgentTask.objects.filter(
            user__client=client
        ).values_list(
            'apikey__app_name', flat=True
        ).distinct().order_by('apikey__app_name')
 
        response_data = {
            "agents": list(agent_names)
        }
       
        return Response(response_data, status=status.HTTP_200_OK)


import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime
from django.http import HttpResponse

stripe.api_key = settings.STRIPE_SECRET_KEY


# ----------------------------------------
# 1️⃣ Create Checkout Session
# ----------------------------------------
class CreateCheckoutSessionView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        amount = request.data.get("amount")
        if not amount:
            return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {"name": "Custom Payment"},
                            "unit_amount": int(amount) * 100,
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=f"{settings.FRONTEND_URL}/admin/payment-overview?status=success",
                cancel_url=f"{settings.FRONTEND_URL}/admin/payment-overview?status=cancel",
            )

            return Response({"checkout_url": checkout_session.url}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------------------
# 2️⃣ Stripe Webhook Handler
# ----------------------------------------
@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except Exception as e:
            print("⚠️ Webhook error:", e)
            return HttpResponse(status=400)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            print("✅ Payment completed for session:", session.get("id"))

        elif event["type"] == "payment_intent.succeeded":
            intent = event["data"]["object"]
            print("✅ PaymentIntent succeeded:", intent.get("id"))

        return HttpResponse(status=200)


# ----------------------------------------
# 3️⃣ Transaction History
# ----------------------------------------
class TransactionHistoryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            payment_intents = stripe.PaymentIntent.list(limit=10)
            transactions = []

            for pi in payment_intents.data:
                owner_name = owner_email = card_number = card_type = "N/A"

                if pi.latest_charge:
                    try:
                        charge = stripe.Charge.retrieve(pi.latest_charge)
                        if charge.payment_method:
                            pm = stripe.PaymentMethod.retrieve(charge.payment_method)

                            if pm.billing_details:
                                owner_name = pm.billing_details.get("name") or "N/A"
                                owner_email = pm.billing_details.get("email") or "N/A"

                            if pm.card:
                                if pm.card.get("last4"):
                                    card_number = f"•••• {pm.card.get('last4')}"
                                brand = pm.card.get("brand")
                                funding = pm.card.get("funding")
                                if brand and funding:
                                    card_type = f"{brand} {funding} card"
                                elif brand:
                                    card_type = f"{brand} card"
                    except Exception:
                        pass

                transactions.append({
                    "id": pi.id,
                    "amount": pi.amount / 100,
                    "currency": pi.currency.upper(),
                    "status": pi.status,
                    "created": datetime.fromtimestamp(pi.created).strftime('%Y-%m-%d %H:%M:%S'),
                    "owner_name": owner_name,
                    "owner_email": owner_email,
                    "card_number": card_number,
                    "card_type": card_type,
                })

            return Response({"transactions": transactions}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


import calendar
from datetime import datetime
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from dateutil.parser import parse
import requests
import pandas as pd
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse

class ClientBillingDataAPIView(APIView):
    """Get billing data for multiple clients for selected month and export as Excel"""
    
    permission_classes = [] 

    def get_clients(self, request):
        """
        Get all clients that the authenticated user has access to.
        For now, return all active clients since permissions are disabled.
        """
        clients = Client.objects.filter(status="active")
        return list(clients), None

    def get_client_emails(self, clients):
        """
        Get emails for all clients by finding users with 'client' role
        associated with each client.
        """
        client_emails = {}
        
        for client in clients:
            try:
                client_users = User.objects.filter(
                    client=client,
                    roles="client"
                )
                
                if client_users.exists():
                    client_user = client_users.first()
                    client_emails[client.client_id] = client_user.mail
                else:
                    any_user = User.objects.filter(client=client).exclude(mail__isnull=True).exclude(mail__exact='').first()
                    if any_user:
                        client_emails[client.client_id] = any_user.mail
                    else:
                        client_emails[client.client_id] = None
            except Exception:
                client_emails[client.client_id] = None
        
        return client_emails

    def get_api_usage_count(self, client, start_date, end_date):
        """
        Fetch API usage count from ClientApiUsage table for the given client and date range.
        """
        try:
            user_api_keys = Agent_API_SecretKeyss.objects.filter(
                user__client=client
            ).values_list('api_key', flat=True)
            
            api_usage = ClientApiUsage.objects.filter(
                apikey__api_key__in=user_api_keys,
                date__gte=start_date,
                date__lte=end_date
            ).aggregate(total_count=Sum('count'))
            
            return api_usage['total_count'] or 0
        except Exception:
            return 0

    def get_slab_config_period(self, period):
        """
        Get slab configuration for a specific period using the period's additional_cost.
        """
        additional_cost = period.get('additional_cost')
        
        if additional_cost and isinstance(additional_cost, dict):
            if any(key in additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                converted_config = self.convert_discount_to_tier_config(additional_cost)
                if converted_config:
                    return converted_config
        
        client = period.get('client')
        if client:
            client_additional_cost = getattr(client, 'additional_cost', None)
            if client_additional_cost and isinstance(client_additional_cost, dict):
                if any(key in client_additional_cost for key in ['discount_1', 'discount1_from', 'discount1_to']):
                    return self.convert_discount_to_tier_config(client_additional_cost)
        
        return None

    def convert_discount_to_tier_config(self, discount_config):
        """
        Convert discount-based configuration to tier-based configuration.
        """
        tier_config = {}
        
        try:
            if 'discount1_from' in discount_config:
                discount1_from = discount_config['discount1_from']
                if discount1_from is not None:
                    try:
                        tier_config['tier1'] = float(discount1_from)
                    except (TypeError, ValueError):
                        pass
            
            if 'discount_1' in discount_config:
                discount_1 = discount_config['discount_1']
                if discount_1 is not None:
                    try:
                        tier_config['rate1'] = float(discount_1)
                    except (TypeError, ValueError):
                        pass
            
            if 'tier1' in tier_config and 'rate1' in tier_config:
                tier_config['tier2'] = tier_config['tier1']
                tier_config['rate2'] = tier_config['rate1']
            
            return tier_config if tier_config else None
            
        except Exception:
            return None

    def build_tier_config(self, license_tier, slab_config):
        """
        Build tier configuration based on license tier and slab config.
        """
        default_config = self.get_default_tier_config(license_tier)
        
        if not slab_config:
            return default_config
        
        try:
            merged_config = default_config.copy()
            
            for key in ['tier1', 'tier2', 'rate1', 'rate2', 'rate']:
                if key in slab_config and slab_config[key] is not None:
                    try:
                        merged_config[key] = float(slab_config[key])
                    except (TypeError, ValueError):
                        pass
            
            return merged_config
            
        except Exception:
            return default_config

    def get_default_tier_config(self, license_tier):
        """Get the default tier configuration for each license tier."""
        if license_tier == 'lite':
            return {'rate': 0.01}
        elif license_tier == 'standard':
            return {
                'tier1': 25000.0,
                'tier2': 25000.0,
                'rate1': 0.07,
                'rate2': 0.07
            }
        elif license_tier == 'pro':
            return {
                'tier1': 70000.0,
                'tier2': 70000.0,
                'rate1': 0.07,
                'rate2': 0.07
            }
        elif license_tier == 'enterprise':
            return {
                'tier1': 200000.0,
                'tier2': 200000.0,
                'rate1': 0.07,
                'rate2': 0.07
            }
        else:
            return {
                'tier1': 0.0,
                'tier2': 0.0,
                'rate1': 0.0,
                'rate2': 0.0
            }

    def get_tier_periods_for_month(self, client, month_start, month_end):             
        """
        Get all tier periods that were active during the selected month
        Respect effective_date from ClientChangeLog for each period.
        """
        change_logs = ClientChangeLog.objects.filter(
            client=client,
            effective_from__lte=month_end,
        ).exclude(
            effective_to__lt=month_start
        ).order_by('effective_from')
        
        periods = []
        total_days_in_month = (month_end - month_start).days + 1
        
        previous_end = month_start - timedelta(days=1)  # Start from day before month starts
        
        for log in change_logs:
            # Use effective_date from change log if available, otherwise use effective_from
            period_effective_date = None
            if log.effective_date:
                period_effective_date = log.effective_date.date()
                print(f"Using effective_date from change log: {period_effective_date}")
            elif log.effective_from:
                period_effective_date = log.effective_from.date()
                print(f"Using effective_from as effective_date: {period_effective_date}")
            else:
                period_effective_date = log.effective_from.date() if log.effective_from else month_start
                print(f"Using effective_from date as fallback: {period_effective_date}")
            
            period_start = max(month_start, period_effective_date) if period_effective_date else month_start
            
            # Avoid overlap with previous period
            if previous_end >= period_start:
                period_start = previous_end + timedelta(days=1)
            
            period_end = min(month_end, log.effective_to.date()) if log.effective_to else month_end
            
            # Only include periods that have at least one day
            if period_start <= period_end:
                tier_cost = self.get_tier_cost_for_period(log, client)
                
                # Get machine counts from change log
                dev_count = log.dev_count if log.dev_count is not None else client.dev_count
                prod_count = log.prod_count if log.prod_count is not None else client.prod_count
                vm_count = log.vm_count if log.vm_count is not None else client.vm_count
                client_vm_count = log.client_vm_count if log.client_vm_count is not None else client.client_vm_count
                
                # ✅ Get ALL cost fields from change log
                client_vm_cost = log.client_vm_cost if log.client_vm_cost is not None else client.client_vm_cost
                client_virtual_machine_cost = log.client_virtual_machine_cost if log.client_virtual_machine_cost is not None else client.client_virtual_machine_cost
                dev_vm_cost = log.dev_vm_cost if log.dev_vm_cost is not None else client.dev_vm_cost
                prod_vm_cost = log.prod_vm_cost if log.prod_vm_cost is not None else client.prod_vm_cost
                
                periods.append({
                    'start_date': period_start,
                    'end_date': period_end,
                    'license_tier': log.license_tier,
                    'tier_cost': tier_cost,
                    'additional_cost': log.additional_cost,
                    'days': (period_end - period_start).days + 1,
                    'total_days_in_month': total_days_in_month,
                    'client': client,
                    'effective_date': period_effective_date,
                    # Include machine counts for this period
                    'dev_count': dev_count,
                    'prod_count': prod_count,
                    'vm_count': vm_count,
                    'client_vm_count': client_vm_count,
                    # ✅ ADDED: Include ALL cost fields from change log
                    'client_vm_cost': client_vm_cost,  # For regular VMs (vm_count)
                    'client_virtual_machine_cost': client_virtual_machine_cost,  # For client VMs (client_vm_count)
                    'dev_vm_cost': dev_vm_cost,  # For dev machines
                    'prod_vm_cost': prod_vm_cost,  # For prod machines
                })
                
                previous_end = period_end
        
        # If no change logs found, create a single period for the entire month
        if not periods:
            # Use month_start as effective_date when no logs exist
            effective_date = month_start
            
            tier_cost = self.get_tier_cost_for_period(None, client)
            
            periods.append({
                'start_date': effective_date,  # Use month_start as effective_date
                'end_date': month_end,
                'license_tier': client.license_tier,
                'tier_cost': tier_cost,
                'additional_cost': client.additional_cost,
                'days': (month_end - effective_date).days + 1,
                'total_days_in_month': total_days_in_month,
                'client': client,
                'effective_date': effective_date,
                # Use current client machine counts
                'dev_count': client.dev_count,
                'prod_count': client.prod_count,
                'vm_count': client.vm_count,
                'client_vm_count': client.client_vm_count,
                # ✅ ADDED: Include ALL cost fields from client table
                'client_vm_cost': client.client_vm_cost,  # For regular VMs
                'client_virtual_machine_cost': client.client_virtual_machine_cost,  # For client VMs
                'dev_vm_cost': client.dev_vm_cost,  # For dev machines
                'prod_vm_cost': client.prod_vm_cost,  # For prod machines
            })
        
        # Debug: Print period information
        print(f"Found {len(periods)} periods for {client.client_name}:")
        for i, period in enumerate(periods):
            print(f"  Period {i+1}: {period['start_date']} to {period['end_date']} ({period['days']} days)")
            print(f"  Effective Date: {period.get('effective_date', 'Not set')}")
            print(f"  Machine Counts - Dev: {period['dev_count']}, Prod: {period['prod_count']}, VM: {period['vm_count']}, Client VM: {period['client_vm_count']}")
            print(f"  Cost Rates - client_vm_cost: ${period.get('client_vm_cost', 'Not set')}, client_virtual_machine_cost: ${period.get('client_virtual_machine_cost', 'Not set')}")
            print(f"                dev_vm_cost: ${period.get('dev_vm_cost', 'Not set')}, prod_vm_cost: ${period.get('prod_vm_cost', 'Not set')}")
        
        return periods

    def get_tier_cost_for_period(self, change_log, client):
        """
        Get the correct tier cost for a period.
        """
        if change_log and change_log.tier_cost is not None:
            return float(change_log.tier_cost)
        elif client.tier_cost is not None:
            return float(client.tier_cost)
        else:
            base_cost_map = {'lite': 600, 'standard': 3500, 'pro': 10500, 'enterprise': 22500}
            license_tier = change_log.license_tier if change_log else client.license_tier
            return base_cost_map.get(license_tier, 0)

    def calculate_period_cost(self, period, transaction_counts, total_days_in_month):
        """
        Calculate cost for a specific tier period
        """
        license_tier = period['license_tier']
        period_days = period['days']
        monthly_tier_cost = period['tier_cost']
        
        base_cost = (monthly_tier_cost / total_days_in_month) * period_days
        
        slab_config = self.get_slab_config_period(period)
        config = self.build_tier_config(license_tier, slab_config)
        
        period_transactions = 0
        for date_str, count in transaction_counts.items():
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            if period['start_date'] <= date_obj <= period['end_date']:
                period_transactions += count
        
        if license_tier == 'lite':
            rate = float(config.get('rate', 0.01))
            variable_cost = period_transactions * rate
            total_cost = base_cost + variable_cost
            
            result = {
                'base_cost': base_cost,
                'variable_cost': variable_cost,
                'total_cost': total_cost,
                'transactions': period_transactions,
                'period_days': period_days,
                'license_tier': license_tier,
                'rate': rate,
                'excess_transactions': period_transactions,
                'tier1': 0,
                'config': config
            }
        else:
            tier1 = float(config.get('tier1', 0))
            tier2 = float(config.get('tier2', tier1))
            rate1 = float(config.get('rate1', 0.07))
            rate2 = float(config.get('rate2', rate1))
            
            excess_transactions = max(0, period_transactions - tier1)
            
            if period_transactions <= tier1:
                variable_cost = 0
            elif tier1 == tier2:
                variable_cost = (period_transactions - tier1) * rate1
            elif period_transactions <= tier2:
                variable_cost = (period_transactions - tier1) * rate1
            else:
                tier1_excess = tier2 - tier1
                tier2_excess = period_transactions - tier2
                variable_cost = (tier1_excess * rate1) + (tier2_excess * rate2)
            
            total_cost = base_cost + variable_cost
            
            result = {
                'base_cost': base_cost,
                'variable_cost': variable_cost,
                'total_cost': total_cost,
                'transactions': period_transactions,
                'period_days': period_days,
                'license_tier': license_tier,
                'rate1': rate1,
                'rate2': rate2,
                'excess_transactions': excess_transactions,
                'tier1': tier1,
                'tier2': tier2,
                'config': config
            }
        
        return result

    def calculate_machine_costs_for_period(self, period, total_days_in_month):
        """
        Calculate machine costs for a specific period based on period machine counts
        Use dynamic rates from ClientChangeLog for ALL machine types
        """
        period_days = period['days']
        
        # Debug what's in the period
        print(f"🔍 DEBUG in calculate_machine_costs_for_period:")
        print(f"  - period.get('client_vm_cost'): {period.get('client_vm_cost')}")
        print(f"  - period.get('client_virtual_machine_cost'): {period.get('client_virtual_machine_cost')}")
        print(f"  - period.get('dev_vm_cost'): {period.get('dev_vm_cost')}")
        print(f"  - period.get('prod_vm_cost'): {period.get('prod_vm_cost')}")
        
        # Get DEV machine rate from period (from ClientChangeLog)
        # FIXED: Only use default if value is None, not if it's 0.00
        dev_vm_cost_value = period.get('dev_vm_cost')
        if dev_vm_cost_value is None:
            DEV_MACHINE_RATE = 200.00  # Default for dev_count
            print(f"ℹ️ Using default DEV rate (dev_vm_cost was None): ${DEV_MACHINE_RATE:.2f}")
        else:
            try:
                DEV_MACHINE_RATE = float(dev_vm_cost_value)
                print(f"✅ Using DEV rate from period data (dev_vm_cost): ${DEV_MACHINE_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting dev_vm_cost to float: {e}, using default 200.00")
                DEV_MACHINE_RATE = 200.00
        
        # Get PROD machine rate from period (from ClientChangeLog)
        # FIXED: Only use default if value is None, not if it's 0.00
        prod_vm_cost_value = period.get('prod_vm_cost')
        if prod_vm_cost_value is None:
            PROD_MACHINE_RATE = 400.00  # Default for prod_count
            print(f"ℹ️ Using default PROD rate (prod_vm_cost was None): ${PROD_MACHINE_RATE:.2f}")
        else:
            try:
                PROD_MACHINE_RATE = float(prod_vm_cost_value)
                print(f"✅ Using PROD rate from period data (prod_vm_cost): ${PROD_MACHINE_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting prod_vm_cost to float: {e}, using default 400.00")
                PROD_MACHINE_RATE = 400.00
        
        # Get VM rate from period (from ClientChangeLog) - for regular VMs (vm_count)
        # FIXED: Only use default if value is None, not if it's 0.00
        client_vm_cost_value = period.get('client_vm_cost')
        if client_vm_cost_value is None:
            VM_MACHINE_RATE = 300.00  # Default VM rate
            print(f"ℹ️ Using default VM rate (client_vm_cost was None): ${VM_MACHINE_RATE:.2f}")
        else:
            try:
                VM_MACHINE_RATE = float(client_vm_cost_value)
                print(f"✅ Using VM rate from period data (client_vm_cost): ${VM_MACHINE_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting client_vm_cost to float: {e}, using default 300.00")
                VM_MACHINE_RATE = 300.00
        
        # Get Client VM rate from period (from ClientChangeLog) - for client VMs (client_vm_count)
        # FIXED: Only use default if value is None, not if it's 0.00
        client_virtual_machine_cost_value = period.get('client_virtual_machine_cost')
        if client_virtual_machine_cost_value is None:
            CLIENT_VM_RATE = 300.00  # Default Client VM rate
            print(f"ℹ️ Using default Client VM rate (client_virtual_machine_cost was None): ${CLIENT_VM_RATE:.2f}")
        else:
            try:
                CLIENT_VM_RATE = float(client_virtual_machine_cost_value)
                print(f"✅ Using Client VM rate from period data (client_virtual_machine_cost): ${CLIENT_VM_RATE:.2f}")
            except (TypeError, ValueError) as e:
                print(f"❌ Error converting client_virtual_machine_cost to float: {e}, using default 300.00")
                CLIENT_VM_RATE = 300.00
        
        # Get machine counts for this period
        dev_count = period.get('dev_count', 0)
        prod_count = period.get('prod_count', 0)
        vm_count = period.get('vm_count', 0)
        client_vm_count = period.get('client_vm_count', 0)
        
        print(f"Calculating machine costs for period {period['start_date']} to {period['end_date']}:")
        print(f"  Dev: {dev_count}, Prod: {prod_count}, VM: {vm_count}, Client VM: {client_vm_count}")
        print(f"  Period days: {period_days}, Total month days: {total_days_in_month}")
        print(f"  Dev Rate: ${DEV_MACHINE_RATE:.2f}/month")
        print(f"  Prod Rate: ${PROD_MACHINE_RATE:.2f}/month")
        print(f"  VM Rate (regular VMs): ${VM_MACHINE_RATE:.2f}/month")
        print(f"  Client VM Rate: ${CLIENT_VM_RATE:.2f}/month")
        
        # Calculate monthly costs with dynamic rates
        monthly_dev_cost = dev_count * DEV_MACHINE_RATE
        monthly_prod_cost = prod_count * PROD_MACHINE_RATE
        monthly_vm_cost = vm_count * VM_MACHINE_RATE  # Uses client_vm_cost from DB
        monthly_client_vm_cost = client_vm_count * CLIENT_VM_RATE  # Uses client_virtual_machine_cost from DB
        
        # Prorate based on days in period
        dev_cost = (monthly_dev_cost / total_days_in_month) * period_days
        prod_cost = (monthly_prod_cost / total_days_in_month) * period_days
        vm_cost = (monthly_vm_cost / total_days_in_month) * period_days
        client_vm_cost = (monthly_client_vm_cost / total_days_in_month) * period_days
        
        # Ensure we have float values (not Decimal)
        dev_cost = float(dev_cost)
        prod_cost = float(prod_cost)
        vm_cost = float(vm_cost)
        client_vm_cost = float(client_vm_cost)
        
        total_machine_cost = dev_cost + prod_cost + vm_cost + client_vm_cost
        
        print(f"  Monthly costs - Dev: ${monthly_dev_cost:.2f}, Prod: ${monthly_prod_cost:.2f}, VM: ${monthly_vm_cost:.2f}, Client VM: ${monthly_client_vm_cost:.2f}")
        print(f"  Prorated costs - Dev: ${dev_cost:.2f}, Prod: ${prod_cost:.2f}, VM: ${vm_cost:.2f}, Client VM: ${client_vm_cost:.2f}")
        print(f"  Total machine cost for period: ${total_machine_cost:.2f}")
        
        return {
            'dev_cost': dev_cost,
            'prod_cost': prod_cost,
            'vm_cost': vm_cost,
            'client_vm_cost': client_vm_cost,
            'total_machine_cost': total_machine_cost,
            'dev_count': dev_count,
            'prod_count': prod_count,
            'vm_count': vm_count,
            'client_vm_count': client_vm_count,
            'dev_rate': DEV_MACHINE_RATE,           # Dynamic rate for dev machines
            'prod_rate': PROD_MACHINE_RATE,         # Dynamic rate for prod machines
            'vm_rate': VM_MACHINE_RATE,             # Dynamic rate for regular VMs
            'client_vm_rate': CLIENT_VM_RATE        # Dynamic rate for client VMs
        }

    def map_email_to_client_transactions(self, external_api_response, client_emails):
        """
        Map external API response to client transactions based on email matching.
        """
        client_transaction_map = {}
        
        # Debug: Print the type and content of external_api_response
        print(f"External API response type: {type(external_api_response)}")
        print(f"External API response content: {external_api_response}")
        
        # Handle case where response might be a string that needs to be parsed as JSON
        if isinstance(external_api_response, str):
            try:
                external_api_response = json.loads(external_api_response)
            except json.JSONDecodeError as e:
                print(f"Failed to parse external API response as JSON: {e}")
                return client_transaction_map
        
        if isinstance(external_api_response, dict) and external_api_response.get('status') == 'success':
            data = external_api_response.get('data', [])
            
            # Create a reverse mapping from email to client_id
            email_to_client_id = {email: client_id for client_id, email in client_emails.items() if email}
            
            print(f"Looking for {len(email_to_client_id)} client emails in API response")
            
            for item in data:
                if isinstance(item, dict):
                    email = item.get('email')
                    transactions = item.get('transaction', [])
                    
                    if email and email in email_to_client_id:
                        client_id = email_to_client_id[email]
                        client_transaction_map[client_id] = transactions
                        print(f"Found transactions for client {client_id} (email: {email}): {len(transactions)} transactions")
                    else:
                        # If email not found in our client emails, try to find by case-insensitive matching
                        for client_id, client_email in client_emails.items():
                            if client_email and client_email.lower() == email.lower():
                                client_transaction_map[client_id] = transactions
                                print(f"Found transactions for client {client_id} (case-insensitive match): {len(transactions)} transactions")
                                break
        
        print(f"Total clients with transactions mapped: {len(client_transaction_map)}")
        return client_transaction_map

    def calculate_client_billing_data(self, client, start_date, end_date, client_transaction_map):
        client_id = client.client_id
        transactions = client_transaction_map.get(client_id, [])
         
        print(f"Processing client {client.client_name} ({client_id}): {len(transactions)} transactions")
        
        # Convert transaction data to the format expected by calculate_period_cost
        transaction_counts = {}
        for transaction in transactions:
            if isinstance(transaction, dict):
                date_str = transaction.get('date')
                total_transaction = transaction.get('total_transaction', 0)
                
                # Don't filter by effective date here - let each period filter its own transactions
                if date_str:
                    try:
                        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
                        transaction_counts[date_str] = int(total_transaction) 
                    except (ValueError, TypeError):
                        transaction_counts[date_str] = 0
            else:
                print(f"Unexpected transaction format: {transaction}")
        
        total_transactions = sum(transaction_counts.values())
        print(f"Total transactions before period filtering: {total_transactions}")
        
        # Get total API usage for the entire month first
        total_api_calls = self.get_api_usage_count(client, start_date, end_date)
        tier_periods = self.get_tier_periods_for_month(client, start_date, end_date)
        
        # Calculate total days in month (should be 30 for September)
        total_days_in_month = (end_date - start_date).days + 1
        print(f"Total days in month for cost calculation: {total_days_in_month}")

        # Monthly usage-based cost
        monthly_api_cost = total_api_calls * 0.10 if total_api_calls > 0 else 0
        
        # AI cost is $200 per month
        monthly_ai_cost = 200.00
        
        rows = []
        
        for period in tier_periods:
            # Filter transactions for this period based on period date range only
            # Remove effective_date filtering here to match GenerateInvoiceView
            period_transaction_counts = {}
            
            for date_str, count in transaction_counts.items():
                date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
                    
                if period['start_date'] <= date_obj <= period['end_date']:
                    period_transaction_counts[date_str] = count
            
            # Use period's total_days_in_month for calculation (consistent with GenerateInvoiceView)
            period_cost = self.calculate_period_cost(period, period_transaction_counts, period['total_days_in_month'])
            
            # Calculate machine costs using period's total_days_in_month
            machine_costs = self.calculate_machine_costs_for_period(period, period['total_days_in_month'])
            
            # Calculate API usage for this specific period
            period_api_calls = 0
            try:
                user_api_keys = Agent_API_SecretKeyss.objects.filter(
                    user__client=client
                ).values_list('api_key', flat=True)
                
                period_api_usage = ClientApiUsage.objects.filter(
                    apikey__api_key__in=user_api_keys,
                    date__gte=period['start_date'],
                    date__lte=period['end_date']
                ).aggregate(total_count=Sum('count'))
                
                period_api_calls = period_api_usage['total_count'] or 0
            except Exception as e:
                print(f"Error fetching period API usage: {e}")
                period_api_calls = 0
            
            # Calculate AI cost using the SAME logic as GenerateInvoiceView
            # Use period['total_days_in_month'] which should be the same as total_days_in_month
            daily_ai_cost = monthly_ai_cost / period['total_days_in_month']
            ai_cost = daily_ai_cost * period['days']  # Use period days from period object
            
            # Calculate API cost based on actual period API calls
            api_cost = period_api_calls * 0.10 
            
            # Total costs for this period - match GenerateInvoiceView structure
            transaction_and_machine_cost = period_cost['total_cost'] + machine_costs['total_machine_cost']
            other_costs_total = api_cost + ai_cost
            final_amount = transaction_and_machine_cost + other_costs_total
            
            print(f"=== BILLING CALCULATION FOR PERIOD {period['start_date']} to {period['end_date']} ===")
            print(f"Period days: {period['days']}, Total month days: {period['total_days_in_month']}")
            print(f"Transactions in period: {period_cost['transactions']}")
            print(f"Base cost: ${period_cost['base_cost']:.2f}")
            print(f"Variable cost: ${period_cost['variable_cost']:.2f}")
            print(f"Transaction cost: ${period_cost['total_cost']:.2f}")
            print(f"Machine cost: ${machine_costs['total_machine_cost']:.2f}")
            print(f"AI Cost calculation:")
            print(f"  Monthly AI cost: ${monthly_ai_cost:.2f}")
            print(f"  Total month days: {period['total_days_in_month']}")
            print(f"  Daily AI cost: ${daily_ai_cost:.4f}")
            print(f"  Period days: {period['days']}")
            print(f"  Period AI cost: ${ai_cost:.2f}")
            print(f"  Period API calls: {period_api_calls}")
            print(f"  Period API cost: ${api_cost:.2f}")
            print(f"  Final amount: ${final_amount:.2f}")
            print("=" * 60)
            
            # Create row with all breakdowns
            row = {
                'Client': client.client_name,
                'License from date': period['start_date'],
                'License to date': period['end_date'],
                'Total no.of Transaction': period_cost['transactions'],
                'Total no.of API usage': period_api_calls,
                'License Tier': period['license_tier'].title(),
                'Transaction threshold': round(period_cost.get('tier1', 0), 2),
                'Threshold Amount': round(period_cost.get('rate1', period_cost.get('rate', 0)), 4),
                # Use period-specific machine counts
                'Dev Count': period['dev_count'],
                'VM count': period['vm_count'],
                'Prod Count': period['prod_count'],
                'Client VM Count': period['client_vm_count'],
                'Effective Date': period.get('effective_date'),
                'Final Amount': round(final_amount, 2),
                # Additional breakdown for reference
                'Base Cost': round(period_cost['base_cost'], 2),
                'Variable Cost': round(period_cost['variable_cost'], 2),
                'Transaction Cost': round(period_cost['total_cost'], 2),
                'Dev Machine Cost': round(machine_costs['dev_cost'], 2),
                'Prod Machine Cost': round(machine_costs['prod_cost'], 2),
                'VM Machine Cost': round(machine_costs['vm_cost'], 2),
                'Client VM Machine Cost': round(machine_costs['client_vm_cost'], 2),
                'Total Machine Cost': round(machine_costs['total_machine_cost'], 2),
                'API Cost': round(api_cost, 2),
                'AI Cost': round(ai_cost, 2),
                'Other Costs Total': round(other_costs_total, 2),
                'Period Days': period['days'],
                'Total Month Days': period['total_days_in_month']
            }
            rows.append(row)
        
        return rows

    def post(self, request):
        # Get selected clients from request data
        print("Request data received for billing calculation:", request.data)
        selected_clients = request.data.get("clients", "all_clients")
        selected_date_str = request.data.get("selected_date")
        
        if not selected_date_str:
            return Response({"error": "Selected date is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            selected_date = parse(selected_date_str)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

        # Get clients based on selection
        if selected_clients == "all_clients":
            clients, error = self.get_clients(request)
        else:
            # Filter clients based on the provided client IDs
            clients = Client.objects.filter(
                client_id__in=selected_clients,
                status="active"
            )
            error = None

        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
        
        if not clients:
            return Response({"error": "No clients found"}, status=status.HTTP_404_NOT_FOUND)

        current_month = timezone.now().date().replace(day=1)
        selected_month = selected_date.replace(day=1).date()
        if selected_month >= current_month:
            return Response({"error": "Billing data can only be generated for previous months"}, status=status.HTTP_400_BAD_REQUEST)

        import calendar
        start_date = selected_date.replace(day=1).date()
        last_day = calendar.monthrange(selected_date.year, selected_date.month)[1]
        end_date = selected_date.replace(day=last_day).date()

        client_emails = self.get_client_emails(clients)
        valid_clients = [client for client in clients if client_emails.get(client.client_id)]
        
        if not valid_clients:
            return Response({"error": "No clients with valid email addresses found"}, status=status.HTTP_400_BAD_REQUEST)

        client_email_list = [client_emails[client.client_id] for client in valid_clients]

        # Fetch transaction data from external API
        external_api_url = "https://droidmetrix.droidal.com/get_client_total_transaction_by_email/"
        headers = {
            "Authorization": "Basic cXYwZmptNThmOTpibmQ4cmthbnNt",
            "Content-Type": "application/json",
        }
        
        payload = {"emails": client_email_list}
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }

        try:
            print(f"Sending request to external API with {len(client_email_list)} emails")
            response = requests.post(
                external_api_url, 
                headers=headers, 
                json=payload,
                params=params,
                timeout=30
            )
            
            print(f"External API response status: {response.status_code}")
            
            if response.status_code != 200:
                return Response(
                    {"error": f"External API error: {response.status_code}"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            # Try to parse the response as JSON
            try:
                external_api_response = response.json()
                print("Successfully parsed external API response as JSON")
            except json.JSONDecodeError:
                # If JSON parsing fails, treat it as text and try to handle it
                external_api_response = response.text
                print(f"Response is not JSON, treating as text. Length: {len(external_api_response)}")
            
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to fetch transaction data: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        # Map external API response to client transactions
        client_transaction_map = self.map_email_to_client_transactions(external_api_response, client_emails)
        
        print(f"Mapped transactions for {len(client_transaction_map)} out of {len(valid_clients)} clients")

        # Calculate billing data for all clients and collect Excel rows
        all_rows = []
        
        for client in valid_clients:
            try:
                client_rows = self.calculate_client_billing_data(client, start_date, end_date, client_transaction_map)
                all_rows.extend(client_rows)
            except Exception as e:
                # Create error row for failed clients
                error_row = {
                    'Client': client.client_name,
                    'License from date': 'ERROR',
                    'License to date': 'ERROR', 
                    'Total no.of Transaction': 0,
                    'Total no.of API usage': 0,
                    'License Tier': 'ERROR',
                    'Transaction threshold': 0,
                    'Threshold Amount': 0,
                    'Dev Count': client.dev_count,
                    'VM count': client.vm_count,
                    'Prod Count': client.prod_count,
                    'Client VM Count': client.client_vm_count,
                    'Effective Date': 'ERROR',
                    'Final Amount': 0,
                    'Error': str(e)
                }
                all_rows.append(error_row)

        # Create Excel file
        df = pd.DataFrame(all_rows)
        
        # Reorder columns as requested
        columns_order = [
            'Client',
            'License from date', 
            'License to date',
            'Total no.of Transaction',
            'Total no.of API usage',
            'License Tier',
            'Transaction threshold',
            'Threshold Amount',
            'Dev Count',
            'Prod Count',
            'VM count',
            'Client VM Count',
            'Effective Date'
            # Final Amount is intentionally NOT here - it goes at the end
        ]
        
        # Add additional breakdown columns (all rounded to 2 decimals)
        additional_columns = [
            'Base Cost', 
            'Variable Cost',
            'Transaction Cost',
            'Dev Machine Cost', 
            'Prod Machine Cost', 
            'VM Machine Cost', 
            'Client VM Machine Cost',
            'Total Machine Cost',
            'API Cost', 
            'AI Cost', 
            'Other Costs Total'
        ]
        
        for col in additional_columns:
            if col in df.columns:
                # Ensure all numeric columns are rounded to 2 decimal places
                if col in ['Base Cost', 'Variable Cost', 'Transaction Cost', 'Dev Machine Cost', 'Prod Machine Cost', 'VM Machine Cost', 'Client VM Machine Cost', 'Total Machine Cost', 'API Cost', 'AI Cost', 'Other Costs Total']:
                    df[col] = df[col].round(2)
                columns_order.append(col)

        if 'Final Amount' in df.columns:
            df['Final Amount'] = df['Final Amount'].round(2)
            columns_order.append('Final Amount')
        
        df = df[columns_order]

        # Create Excel response
        try:
            output = BytesIO()
            
            # Use pandas to create Excel file
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Billing Data', index=False)
                
                # Auto-adjust column widths
                worksheet = writer.sheets['Billing Data']
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = (max_length + 2)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
            
            # Get the bytes data
            output.seek(0)
            excel_data = output.getvalue()
            output.close()
            
            print(f"Excel data created successfully. Size: {len(excel_data)} bytes")
            
            # Create HTTP response with proper headers
            response = HttpResponse(
                excel_data,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="billing_data_{start_date.strftime("%Y_%m")}.xlsx"'
            response['Content-Length'] = len(excel_data)
            
            return response
            
        except Exception as e:
            print(f"Error creating Excel file: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to create Excel file: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ClientUsersListAPIView(generics.ListAPIView):
    
    permission_classes = []  
    serializer_class = ClientUsernameSerializer

    def get_queryset(self):
        return User.objects.filter(
            roles="client"
        ).select_related('client').distinct()