from django.apps import AppConfig
from django.db.models.signals import post_migrate
import logging
import sys

logger = logging.getLogger(__name__)


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'
    
    def ready(self):
        """Called when Django starts. Auto-populate default contexts if none exist."""
        # Always connect to post_migrate signal to populate after migrations
        post_migrate.connect(self._populate_after_migrate, sender=self)
        
        # For normal server startup, defer database access to avoid warnings
        # Use a small delay to ensure database is ready
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv or 'uvicorn' in sys.argv:
            import threading
            def deferred_populate():
                import time
                time.sleep(1)  # Wait 1 second for database to be ready
                try:
                    from .models import ChatbotContext
                    if not ChatbotContext.objects.exists():
                        logger.info("No chatbot contexts found. Populating default contexts...")
                        self._populate_default_contexts()
                        logger.info("Default chatbot contexts populated successfully.")
                except Exception as e:
                    # Database not ready yet - post_migrate signal will handle it
                    logger.debug(f"Could not populate contexts on startup: {e}")
            
            # Run in background thread to avoid blocking
            thread = threading.Thread(target=deferred_populate, daemon=True)
            thread.start()
    
    def _populate_after_migrate(self, sender, **kwargs):
        """Populate contexts after migrations are complete."""
        try:
            from .models import ChatbotContext
            
            if not ChatbotContext.objects.exists():
                logger.info("No chatbot contexts found. Populating default contexts...")
                self._populate_default_contexts()
                logger.info("Default chatbot contexts populated successfully.")
        except Exception as e:
            logger.warning(f"Could not auto-populate chatbot contexts: {e}")
    
    def _populate_default_contexts(self):
        """Populate default context entries."""
        from .models import ChatbotContext
        
        default_contexts = {
            'intro': {
                'title': 'Chatbot Introduction',
                'content': '''Welcome to Prestige Car Hire Management! I'm your AI assistant, here to help you with all your car hire needs.

I can assist you with:
- Car hire bookings and reservations
- Vehicle information and fleet details
- Insurance claims and accident reporting
- Car sales and purchases
- General inquiries and support

Feel free to ask me anything, and I'll do my best to help you. How can I assist you today?''',
                'keywords': 'welcome, hello, hi, help, introduction, start, begin',
                'display_order': 0,
            },
            'company': {
                'title': 'Company Information',
                'content': '''Prestige Car Hire Management is a leading car hire service provider specializing in luxury and premium vehicle rentals.

We pride ourselves on:
- Exceptional customer service
- A diverse fleet of high-quality vehicles
- Competitive pricing and flexible rental options
- Comprehensive insurance coverage
- Professional and reliable service

Our mission is to provide you with the best car hire experience, whether you need a vehicle for business, leisure, or special occasions.''',
                'keywords': 'company, about, information, who, what, business, organization',
                'display_order': 1,
            },
            'services': {
                'title': 'Services Overview',
                'content': '''Prestige Car Hire Management offers a comprehensive range of services:

1. **Car Hire & Rentals**: Short-term and long-term vehicle rentals for all your needs
2. **Vehicle Sales**: Buy quality pre-owned vehicles from our fleet
3. **Insurance Services**: Comprehensive insurance coverage and claims management
4. **Fleet Management**: Professional fleet solutions for businesses
5. **Personal Assistance**: Dedicated support for your car hire needs
6. **Introducer Support**: Specialized services for introducers and partners

We cater to individuals, businesses, and organizations with flexible solutions tailored to your requirements.''',
                'keywords': 'services, what do you offer, what services, help, assistance, support',
                'display_order': 2,
            },
            'working': {
                'title': 'How We Work',
                'content': '''Here's how our car hire process works:

1. **Browse & Select**: Choose from our extensive fleet of vehicles
2. **Book Online**: Make a reservation through our website or contact us directly
3. **Verification**: We'll verify your details and rental requirements
4. **Pickup**: Collect your vehicle from our location or arrange delivery
5. **Enjoy**: Drive with confidence knowing you have full insurance coverage
6. **Return**: Return the vehicle at the agreed time and location

For car sales, we offer:
- Vehicle inspection and valuation
- Transparent pricing
- Flexible financing options
- Complete documentation support

Our team is always available to guide you through the process and answer any questions.''',
                'keywords': 'how it works, process, procedure, steps, workflow, how do I',
                'display_order': 3,
            },
            'faqs': {
                'title': 'Frequently Asked Questions',
                'content': '''Common questions and answers:

**Q: What documents do I need to rent a car?**
A: You'll typically need a valid driving license, proof of identity, and a credit card for the security deposit.

**Q: What is included in the rental price?**
A: The rental price includes the vehicle, basic insurance, and roadside assistance. Additional services may incur extra charges.

**Q: Can I extend my rental period?**
A: Yes, subject to vehicle availability. Please contact us in advance to arrange an extension.

**Q: What happens if I have an accident?**
A: Contact us immediately, and we'll guide you through the claims process. We have comprehensive insurance coverage.

**Q: Do you offer long-term rentals?**
A: Yes, we offer both short-term and long-term rental options with competitive rates.

**Q: Can I purchase a vehicle from your fleet?**
A: Yes, we regularly update our fleet and offer quality pre-owned vehicles for sale.

For more specific questions, please don't hesitate to ask!''',
                'keywords': 'faq, questions, answers, help, common, frequently asked',
                'display_order': 4,
            },
            'pricing': {
                'title': 'Pricing Information',
                'content': '''Our pricing is competitive and transparent, with rates based on:

- Vehicle type and model
- Rental duration (daily, weekly, monthly)
- Seasonal demand
- Additional services and insurance options

We offer:
- Flexible pricing plans for short and long-term rentals
- Special rates for business customers
- Competitive pricing for vehicle purchases
- Transparent pricing with no hidden fees

For specific pricing information, please contact us or use our online booking system to get an instant quote. We're happy to discuss custom pricing for extended rentals or fleet requirements.''',
                'keywords': 'price, pricing, cost, rates, fees, how much, quote, quotation',
                'display_order': 5,
            },
            'contact': {
                'title': 'Contact Details',
                'content': '''Get in touch with us:

**Email**: info@prestigecarhire.co.uk
**Phone**: Please contact us via email for our current phone number

**Office Hours**: 
- Monday to Friday: 9:00 AM - 6:00 PM
- Saturday: 10:00 AM - 4:00 PM
- Sunday: Closed

**Address**: Please contact us at info@prestigecarhire.co.uk for our current office address and location.

You can also reach us through:
- Our website contact form
- This chatbot for immediate assistance
- Email for detailed inquiries

We aim to respond to all inquiries within 24 hours during business days.''',
                'keywords': 'contact, email, phone, address, location, office, reach, get in touch',
                'display_order': 6,
            },
            'policies': {
                'title': 'Company Policies',
                'content': '''Our policies ensure a smooth and fair experience for all customers:

**Rental Policies**:
- Minimum age requirement: 21 years (may vary by vehicle type)
- Valid driving license required
- Security deposit required for all rentals
- Fuel policy: Return with same level or pay difference
- Late return fees may apply

**Cancellation Policy**:
- Free cancellation up to 24 hours before pickup
- Cancellation fees may apply for last-minute cancellations

**Insurance Coverage**:
- Comprehensive insurance included in all rentals
- Additional coverage options available
- Claims process clearly explained at pickup

**Privacy Policy**:
- We respect your privacy and protect your personal information
- Data is used only for rental and service purposes
- We comply with all data protection regulations

**Terms & Conditions**:
- Full terms available at booking
- All customers must agree to terms before rental
- Policies subject to change with notice

For detailed policy information, please contact us or refer to your rental agreement.''',
                'keywords': 'policy, policies, terms, conditions, rules, regulations, cancellation, refund',
                'display_order': 7,
            },
            'emergency': {
                'title': 'Emergency Services',
                'content': '''In case of emergencies or urgent situations:

**Roadside Assistance**:
- 24/7 roadside assistance included with all rentals
- Contact our emergency hotline (provided at pickup)
- We'll arrange immediate assistance for breakdowns, accidents, or other issues

**Accident Reporting**:
- If you're involved in an accident, contact us immediately
- Do not admit fault or liability
- Take photos and gather witness information if safe to do so
- We'll guide you through the claims process

**Emergency Contact**:
- For urgent matters, contact us via email: info@prestigecarhire.co.uk
- Emergency contact details are provided in your rental documentation
- We're here to help 24/7 for genuine emergencies

**After-Hours Support**:
- Emergency support available outside business hours
- Response times may vary for non-emergency inquiries

Your safety and peace of mind are our top priorities.''',
                'keywords': 'emergency, urgent, accident, breakdown, help, assistance, roadside, support',
                'display_order': 8,
            },
        }
        
        for section, context_data in default_contexts.items():
            ChatbotContext.objects.get_or_create(
                section=section,
                defaults={
                    'title': context_data['title'],
                    'content': context_data['content'],
                    'keywords': context_data['keywords'],
                    'is_active': True,
                    'display_order': context_data['display_order'],
                }
            )
