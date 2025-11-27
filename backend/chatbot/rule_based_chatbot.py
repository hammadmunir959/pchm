"""
Rule-Based Chatbot Service
A comprehensive hardcoded chatbot that provides intelligent responses
based on keyword matching and pattern recognition.
Used as a fallback when LLM services are unavailable.
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any

logger = logging.getLogger(__name__)


class RuleBasedChatbot:
    """
    Rule-based chatbot with comprehensive hardcoded responses
    covering all aspects of car hire business.
    """
    
    def __init__(self):
        # Comprehensive response database
        self.responses = self._initialize_responses()
        self.greeting_patterns = self._initialize_greeting_patterns()
        self.context_patterns = self._initialize_context_patterns()
        
    def _initialize_greeting_patterns(self) -> Dict[str, List[str]]:
        """Initialize greeting patterns and responses"""
        return {
            'greeting': [
                r'\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|good day)\b',
                r'\b(howdy|what\'?s up|sup|yo)\b',
                r'\b(start|begin|help me)\b'
            ],
            'goodbye': [
                r'\b(bye|goodbye|farewell|see you|see ya|later|thanks|thank you|cheers)\b',
                r'\b(that\'?s all|that\'?s it|nothing else|no more|done|finished)\b'
            ]
        }
    
    def _initialize_context_patterns(self) -> Dict[str, Dict]:
        """Initialize context-based patterns with responses"""
        return {
            'greeting': {
                'patterns': [
                    r'\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b',
                    r'\b(how are you|how\'?s it going|how do you do)\b'
                ],
                'responses': [
                    "Hello! Welcome to Prestige Car Hire Management. I'm here to help you with all your car hire needs. How can I assist you today?",
                    "Hi there! Thanks for reaching out to Prestige Car Hire. What can I help you with today?",
                    "Good day! I'm here to help you with car rentals, bookings, and any questions you might have. What would you like to know?",
                    "Hello! Welcome to our car hire service. Whether you need to book a vehicle, get pricing information, or have any questions, I'm here to help!"
                ]
            },
            'company_info': {
                'patterns': [
                    r'\b(who are you|what is|tell me about|about you|company|business|services|what do you do)\b',
                    r'\b(prestige|car hire|rental|fleet)\b'
                ],
                'responses': [
                    "Prestige Car Hire Management is a premier car rental service offering luxury and standard vehicles for hire. We provide exceptional customer service, flexible rental options, and a wide range of vehicles to suit your needs.",
                    "We are Prestige Car Hire Management, a trusted car rental company specializing in providing quality vehicles for short and long-term rentals. Our services include vehicle hire, insurance services, and comprehensive customer support.",
                    "Prestige Car Hire Management offers professional car rental services with a focus on customer satisfaction. We provide various vehicle options, competitive pricing, and reliable support throughout your rental period."
                ]
            },
            'pricing': {
                'patterns': [
                    r'\b(price|cost|fee|rate|charge|how much|pricing|expensive|cheap|budget|affordable)\b',
                    r'\b(daily|weekly|monthly|per day|per week|per month)\b',
                    r'\b(discount|deal|offer|special|promotion)\b'
                ],
                'responses': [
                    "Our pricing varies depending on the vehicle type, rental duration, and season. We offer competitive rates for daily, weekly, and monthly rentals. For specific pricing quotes, please visit the 'Contact Us' page to get in touch with our team, or check the 'Our Fleet' page to see vehicles and inquire about rates.",
                    "Pricing depends on several factors including the vehicle category, rental period, and any additional services. We offer flexible pricing options and special rates for longer rentals. Visit the 'Contact Us' page for a personalized quote, or browse vehicles on the 'Our Fleet' page.",
                    "We provide transparent and competitive pricing for all our vehicles. Rates are calculated based on vehicle type, rental duration, and optional extras. For the most accurate quote, visit the 'Contact Us' page to speak with our team, or check out vehicles on the 'Our Fleet' page."
                ]
            },
            'booking': {
                'patterns': [
                    r'\b(book|reserve|rent|hire|rental|appointment|schedule|availability|available)\b',
                    r'\b(need a car|want to rent|looking for|interested in)\b',
                    r'\b(pickup|pick up|collect|delivery|drop off|return)\b'
                ],
                'responses': [
                    "I'd be happy to help you with a booking! You can browse our available vehicles and make a booking through our website. Visit the 'Our Fleet' page to see all available vehicles, or go to the 'Contact Us' page to speak with our team directly. Would you like me to guide you to a specific page?",
                    "Great! To make a booking, I recommend visiting our 'Our Fleet' page where you can see all available vehicles. You can also contact us directly through the 'Contact Us' page for personalized assistance with your booking. Which would you prefer?",
                    "For bookings, please visit our 'Our Fleet' page to browse available vehicles, or use the 'Contact Us' page to get in touch with our team. They can help you find the perfect vehicle and arrange your rental. Need directions to these pages?"
                ]
            },
            'contact': {
                'patterns': [
                    r'\b(contact|phone|call|email|address|location|where|office|headquarters)\b',
                    r'\b(speak to|talk to|reach|get in touch|connect)\b',
                    r'\b(phone number|telephone|mobile|landline)\b'
                ],
                'responses': [
                    "You can reach us through our 'Contact Us' page on the website, where you'll find our contact form, email (info@prestigecarhire.co.uk), and phone number. Visit the Contact Us page to get in touch with our team - we're here to help!",
                    "For contact information and to reach our team, please visit the 'Contact Us' page on our website. You'll find our contact form, email address, and phone number there. Our team is available to assist you with bookings, inquiries, and support!",
                    "To contact us, go to the 'Contact Us' page on our website. You can use the contact form, email us at info@prestigecarhire.co.uk, or call us directly. All contact details are available on that page!"
                ]
            },
            'vehicle_types': {
                'patterns': [
                    r'\b(sedan|suv|sports car|luxury|economy|compact|van|truck|convertible|estate|hatchback)\b',
                    r'\b(what cars|which vehicles|fleet|models|brands)\b',
                    r'\b(bmw|mercedes|audi|porsche|ferrari|lamborghini|range rover|jaguar)\b'
                ],
                'responses': [
                    "We offer a wide range of vehicles including economy cars, sedans, SUVs, luxury vehicles, sports cars, and commercial vehicles. To see our full fleet, visit the 'Our Fleet' page on our website where you can browse all available vehicles with details, photos, and specifications.",
                    "Our fleet includes compact cars, sedans, SUVs, luxury vehicles, sports cars, vans, and more. Check out the 'Our Fleet' page to see all available vehicles, view photos, and get detailed information about each vehicle. Is there a specific type you're interested in?",
                    "We have an extensive fleet covering economy, mid-range, luxury, and premium vehicles. Visit the 'Our Fleet' page to browse our complete selection with detailed information, photos, and availability. What type of vehicle are you looking for?"
                ]
            },
            'insurance': {
                'patterns': [
                    r'\b(insurance|cover|coverage|insured|claim|accident|damage|liability)\b',
                    r'\b(what if|what happens if|protection|policy)\b',
                    r'\b(collision|comprehensive|third party)\b'
                ],
                'responses': [
                    "We offer comprehensive insurance coverage options for all rentals. For detailed information about our insurance services, visit the 'Insurance Services' page on our website. If you need to make a claim, you can use the 'Make a Claim' page. Would you like directions to either of these pages?",
                    "All our rentals include basic insurance coverage, and we offer additional protection options. Visit the 'Insurance Services' page to learn more about our coverage options. For accident claims, go to the 'Make a Claim' page to start the process.",
                    "We provide various insurance options to protect you during your rental period. Check out the 'Insurance Services' page for detailed information about coverage. If you've had an accident, visit the 'Make a Claim' page to file a claim."
                ]
            },
            'requirements': {
                'patterns': [
                    r'\b(license|driving license|permit|id|identification|age|minimum|requirements|need|required)\b',
                    r'\b(how old|age limit|qualifications|eligibility)\b',
                    r'\b(documents|paperwork|proof)\b'
                ],
                'responses': [
                    "To rent a vehicle, you'll need: a valid driving license (held for at least 1-2 years depending on vehicle type), proof of identity, a credit or debit card for the security deposit, and you must meet our minimum age requirement (typically 21-25 years depending on vehicle category).",
                    "Rental requirements include: a valid full driving license, ID proof, payment method for deposit, and meeting age requirements. For luxury or premium vehicles, additional requirements may apply. Would you like specific details for a particular vehicle type?",
                    "You'll need a valid driving license, identification, and a payment method. Age requirements vary by vehicle category. For standard vehicles, drivers typically need to be 21+, while premium vehicles may require 25+. Can I help with specific requirements?"
                ]
            },
            'payment': {
                'patterns': [
                    r'\b(payment|pay|deposit|security|refund|card|credit|debit|cash|payment method)\b',
                    r'\b(how to pay|payment options|accepted|methods)\b',
                    r'\b(hold|authorization|pre-authorization)\b'
                ],
                'responses': [
                    "We accept major credit and debit cards. A security deposit is required at the time of rental, which is typically held as a pre-authorization on your card and released after the vehicle is returned in good condition. The deposit amount varies by vehicle type.",
                    "Payment can be made via credit or debit card. We require a security deposit that's held on your card during the rental period. This deposit is fully refundable provided the vehicle is returned in the same condition. For specific deposit amounts, please inquire about your chosen vehicle.",
                    "We accept credit and debit cards for payment. A refundable security deposit is required, which is held on your card and released after vehicle return. Deposit amounts depend on the vehicle category. Cash payments may be available for certain rentals - please inquire."
                ]
            },
            'cancellation': {
                'patterns': [
                    r'\b(cancel|cancellation|refund|change|modify|reschedule|postpone)\b',
                    r'\b(what if i|if i need to|change my mind)\b',
                    r'\b(booking change|modify booking|cancel booking)\b'
                ],
                'responses': [
                    "Our cancellation policy allows for booking changes and cancellations. Cancellation terms depend on how far in advance you cancel and the type of booking. Generally, cancellations made 24-48 hours before pickup are fully refundable. For specific terms, please check your booking confirmation or contact us.",
                    "You can cancel or modify your booking subject to our cancellation policy. Free cancellations are typically available if made within a reasonable timeframe before your rental date. Late cancellations may incur charges. For details about your specific booking, please contact us.",
                    "Cancellation and modification policies vary by booking type and timing. We aim to be flexible - cancellations made well in advance are usually free. For exact terms related to your booking, please reach out to our team who can provide specific information."
                ]
            },
            'delivery': {
                'patterns': [
                    r'\b(delivery|pickup|collect|drop off|return|location|where|airport|station)\b',
                    r'\b(can you bring|bring to|deliver to|pickup location)\b',
                    r'\b(meet|meeting point|collection point)\b'
                ],
                'responses': [
                    "We offer flexible pickup and return options. You can collect your vehicle from our office locations, or we can arrange delivery to airports, train stations, hotels, or other convenient locations (subject to availability and additional fees). Where would be most convenient for you?",
                    "Pickup and delivery options are available. Standard collection is from our office, but we can arrange delivery to various locations including airports and hotels for an additional fee. Return can be to the same or different location. What location works best for you?",
                    "We provide multiple pickup and return options. Standard service includes office collection, with delivery available to airports, hotels, and other locations. Delivery fees may apply depending on location. Where would you like to collect or have the vehicle delivered?"
                ]
            },
            'hours': {
                'patterns': [
                    r'\b(hours|opening|open|close|closed|available|when|time|business hours|office hours)\b',
                    r'\b(weekend|saturday|sunday|holiday|bank holiday)\b',
                    r'\b(24|24/7|always open|emergency)\b'
                ],
                'responses': [
                    "Our office hours are typically Monday to Friday 9 AM to 6 PM, and Saturday 9 AM to 4 PM. We're closed on Sundays and bank holidays. However, we offer 24/7 roadside assistance for emergencies. For specific hours or holiday schedules, please contact us.",
                    "We're open Monday-Friday 9 AM-6 PM and Saturday 9 AM-4 PM. Sunday and bank holiday availability may be limited. Emergency roadside assistance is available 24/7. For exact hours or to arrange out-of-hours service, please get in touch.",
                    "Standard office hours are weekdays 9 AM-6 PM and Saturdays 9 AM-4 PM. We're closed Sundays and most bank holidays. 24/7 emergency support is available for roadside assistance. Need service outside these hours? Contact us to discuss options."
                ]
            },
            'emergency': {
                'patterns': [
                    r'\b(emergency|breakdown|accident|stuck|broken|problem|issue|help|urgent)\b',
                    r'\b(what do i do|what should i|what happens if|if something)\b',
                    r'\b(roadside|assistance|support|help me)\b'
                ],
                'responses': [
                    "In case of an emergency, breakdown, or accident, please contact our 24/7 emergency helpline immediately. We'll provide roadside assistance, arrange recovery if needed, and help you get back on the road or provide a replacement vehicle. Your safety is our priority!",
                    "For emergencies, breakdowns, or accidents, call our 24/7 emergency support line right away. We offer comprehensive roadside assistance including towing, tire changes, jump starts, and lockout service. If the vehicle can't be repaired quickly, we'll arrange a replacement.",
                    "Emergency support is available 24/7! If you experience a breakdown, accident, or any urgent issue, contact our emergency helpline immediately. We provide roadside assistance, recovery services, and can arrange replacement vehicles when necessary. Don't hesitate to call!"
                ]
            },
            'testimonials': {
                'patterns': [
                    r'\b(review|testimonial|feedback|rating|experience|opinion|what others say)\b',
                    r'\b(recommend|recommendation|trustworthy|reliable)\b',
                    r'\b(good|bad|satisfied|customer service)\b'
                ],
                'responses': [
                    "We're proud of our excellent customer reviews and testimonials! Visit the 'Testimonials' page on our website to read what our customers say about our service quality, vehicle condition, and customer support. We'd love to add your positive experience too!",
                    "Customer satisfaction is important to us! Check out the 'Testimonials' page to see reviews from our customers who appreciate our reliable service, well-maintained vehicles, and helpful staff. You can also share your own experience there!",
                    "We value our customers' feedback! Visit the 'Testimonials' page to read reviews from customers who appreciate our professional service, quality vehicles, and responsive support. You can also leave your own testimonial there."
                ]
            },
            'goodbye': {
                'patterns': [
                    r'\b(bye|goodbye|farewell|see you|thanks|thank you|cheers|appreciate)\b',
                    r'\b(that\'?s all|that\'?s it|nothing else|no more|done|finished|all set)\b',
                    r'\b(great|perfect|sounds good|okay|ok|alright)\b'
                ],
                'responses': [
                    "You're very welcome! I'm always here to help whenever you need assistance with car hire, bookings, or any questions. Feel free to reach out anytime. Have a wonderful day!",
                    "Thank you for contacting Prestige Car Hire! If you need anything else or have more questions, I'm here to help. We look forward to serving you. Take care!",
                    "It was my pleasure to assist you! Remember, I'm always available if you need help with bookings, information, or support. Don't hesitate to reach out anytime. Have a great day!"
                ]
            },
            'general_help': {
                'patterns': [
                    r'\b(help|what can you|what do you|how can you|assist|support)\b',
                    r'\b(what services|what options|what do you offer)\b',
                    r'\b(guide|information|tell me|explain)\b'
                ],
                'responses': [
                    "I can help guide you to the right pages on our website! Here's what's available: 'Our Fleet' for browsing vehicles, 'Contact Us' for inquiries, 'Insurance Services' for coverage info, 'Make a Claim' for accident claims, 'Car Sales' for purchasing vehicles, 'Testimonials' for reviews, and 'Our People' to learn about our team. What would you like to explore?",
                    "I'm here to help you navigate our website! You can visit: 'Our Fleet' to see available vehicles, 'Contact Us' to reach our team, 'Insurance Services' for insurance details, 'Make a Claim' for filing claims, 'Car Sales' to buy a vehicle, 'Testimonials' for customer reviews, or 'Our People' to meet our team. Which page interests you?",
                    "I can guide you to the information you need! Our website has pages for: vehicle fleet browsing, contact information, insurance services, making claims, car sales, customer testimonials, and learning about our team. What would you like help finding?"
                ]
            },
            'faq_general': {
                'patterns': [
                    r'\b(how long|duration|minimum|maximum|days|weeks|months)\b',
                    r'\b(extend|extension|keep longer|more time)\b',
                    r'\b(early return|return early|bring back early)\b'
                ],
                'responses': [
                    "Rental duration is flexible - we offer daily, weekly, and monthly rentals. Minimum rental periods vary by vehicle type (typically 1-3 days). You can extend your rental if the vehicle is available, or return early (subject to our terms). What duration are you considering?",
                    "We offer flexible rental periods from daily to monthly rentals. Minimum rental terms depend on the vehicle category. Extensions are possible if the vehicle is available. Early returns are allowed but may affect pricing. How long do you need the vehicle?",
                    "Rental periods are flexible - daily, weekly, or monthly options available. Minimum rental terms apply (usually 1-3 days). Extensions can be arranged if available. Early returns are possible but pricing adjustments may apply. What's your rental duration?"
                ]
            },
            'vehicle_features': {
                'patterns': [
                    r'\b(features|equipment|gps|navigation|bluetooth|air conditioning|ac|heating)\b',
                    r'\b(automatic|manual|transmission|petrol|diesel|electric|hybrid)\b',
                    r'\b(seats|passengers|luggage|boot|trunk|space)\b'
                ],
                'responses': [
                    "Our vehicles come with various features depending on the category. Standard features often include air conditioning, Bluetooth connectivity, GPS navigation (in many vehicles), and modern safety features. Visit the 'Our Fleet' page to see detailed specifications for each vehicle.",
                    "Vehicle features depend on the category and model. Many include AC, Bluetooth, GPS, USB ports, and safety systems. We have both automatic and manual transmission options, and various fuel types. Check the 'Our Fleet' page for specific vehicle details.",
                    "Features vary by vehicle type and model. Common features include air conditioning, infotainment systems, Bluetooth, GPS (in many vehicles), and safety equipment. Visit the 'Our Fleet' page to see detailed information about each vehicle's features."
                ]
            },
            'car_sales': {
                'patterns': [
                    r'\b(buy|purchase|car sales|buying|interested in buying|want to buy)\b',
                    r'\b(available for sale|for sale|selling|purchase a car)\b',
                    r'\b(finance|financing|payment plan|installment)\b'
                ],
                'responses': [
                    "Great! We offer vehicles for purchase through our car sales service. Visit the 'Car Sales' page on our website to browse vehicles available for purchase, view pricing, and submit a purchase inquiry. You can also contact us through the 'Contact Us' page for more information.",
                    "To purchase a vehicle, visit the 'Car Sales' page where you can see all vehicles available for sale, get pricing information, and submit a purchase request. Our team will get back to you with details. Need directions to the Car Sales page?",
                    "For car purchases, go to the 'Car Sales' page on our website. There you can browse available vehicles, view specifications, check pricing, and submit a purchase inquiry. You can also contact us directly through the 'Contact Us' page for assistance."
                ]
            },
            'car_sell': {
                'patterns': [
                    r'\b(sell|selling|sell my car|trade in|trade-in|valuation|value my car)\b',
                    r'\b(want to sell|looking to sell|sell vehicle|part exchange)\b',
                    r'\b(how much is|what is my car worth|estimate|appraisal)\b'
                ],
                'responses': [
                    "We'd be happy to help you sell your vehicle! Visit the 'Car Sales' page on our website where you can submit a sell request with details about your vehicle. Our team will provide a valuation and discuss options with you. You can also contact us through the 'Contact Us' page.",
                    "To sell your vehicle, go to the 'Car Sales' page and submit a sell request with information about your car. We'll provide a valuation and discuss the best options for you. Need help finding the Car Sales page?",
                    "For selling your vehicle, visit the 'Car Sales' page where you can submit details about your car for a valuation. Our team will review your information and get back to you. You can also reach out through the 'Contact Us' page for immediate assistance."
                ]
            },
            'make_claim': {
                'patterns': [
                    r'\b(claim|make a claim|accident|had an accident|insurance claim)\b',
                    r'\b(file a claim|submit claim|claim process|need to claim)\b',
                    r'\b(replacement vehicle|accident replacement|claim vehicle)\b'
                ],
                'responses': [
                    "If you've had an accident and need to make a claim, visit the 'Make a Claim' page on our website. There you can submit your claim details and request a replacement vehicle. Our team will process your claim and arrange a suitable vehicle for you.",
                    "To make an accident claim, go to the 'Make a Claim' page where you can fill out the claim form with details about your accident. We'll help you get a replacement vehicle quickly. Need directions to the Make a Claim page?",
                    "For accident claims, visit the 'Make a Claim' page on our website. Submit your claim information there, and we'll arrange a replacement vehicle for you. You can also contact us through the 'Contact Us' page if you need immediate assistance."
                ]
            },
            'services': {
                'patterns': [
                    r'\b(services|what we do|what services|personal assistance|introducer|insurance services)\b',
                    r'\b(what do you offer|what can you do|services available)\b'
                ],
                'responses': [
                    "We offer several services including car hire, accident replacement vehicles, insurance claim management, personal assistance, introducer support, and insurance services. Visit the 'What We Do' page on our website to learn more about all our services, or check out 'Personal Assistance', 'Introducer Support', and 'Insurance Services' pages for specific details.",
                    "Our services include car hire, accident replacement vehicles, insurance services, and comprehensive customer support. Check out the 'What We Do' page for an overview, or visit 'Personal Assistance', 'Introducer Support', and 'Insurance Services' pages for detailed information about each service.",
                    "We provide car hire, accident replacement vehicles, insurance services, and customer support. The 'What We Do' page has an overview of all services. For specific services, visit 'Personal Assistance', 'Introducer Support', or 'Insurance Services' pages."
                ]
            }
        }
    
    def _initialize_responses(self) -> Dict[str, List[str]]:
        """Initialize general response patterns"""
        return {
            'default': [
                "I'm here to help with car hire and related services. Could you provide more details about what you're looking for?",
                "I'd be happy to assist you! Could you tell me more about what you need help with?",
                "Let me help you with that. Could you give me a bit more information so I can provide the best assistance?"
            ],
            'unclear': [
                "I want to make sure I understand correctly. Could you rephrase your question or provide more details?",
                "I'm not entirely sure I understand. Could you clarify what you're looking for?",
                "To help you better, could you provide a bit more context or rephrase your question?"
            ]
        }
    
    def classify_intent(self, message: str) -> Tuple[str, float]:
        """
        Classify user intent based on keyword matching and patterns.
        Returns (intent, confidence_score)
        NEVER throws exceptions - always returns a valid result.
        """
        try:
            if not message:
                return 'unclear', 0.0
            
            message_lower = message.lower().strip()
            
            if not message_lower:
                return 'unclear', 0.0
            
            # Score each intent category
            intent_scores = {}
            
            for intent, context_data in self.context_patterns.items():
                try:
                    score = 0.0
                    patterns = context_data.get('patterns', [])
                    
                    for pattern in patterns:
                        try:
                            matches = len(re.findall(pattern, message_lower, re.IGNORECASE))
                            if matches > 0:
                                score += matches * 0.3  # Weight pattern matches
                                # Boost score if multiple patterns match
                                if matches > 1:
                                    score += 0.2
                        except Exception:
                            # Skip invalid patterns
                            continue
                    
                    # Check for exact keyword matches (higher weight)
                    try:
                        keywords = {
                            'greeting': ['hello', 'hi', 'hey', 'greetings'],
                            'goodbye': ['bye', 'goodbye', 'thanks', 'thank you'],
                            'booking': ['book', 'rent', 'hire', 'reserve'],
                            'pricing': ['price', 'cost', 'how much'],
                            'contact': ['contact', 'phone', 'email', 'address'],
                            'vehicle_types': ['car', 'vehicle', 'sedan', 'suv'],
                            'insurance': ['insurance', 'cover', 'coverage'],
                            'requirements': ['license', 'age', 'need', 'required'],
                            'payment': ['payment', 'pay', 'deposit'],
                            'cancellation': ['cancel', 'refund', 'change'],
                            'delivery': ['delivery', 'pickup', 'collect'],
                            'hours': ['hours', 'open', 'when'],
                            'emergency': ['emergency', 'breakdown', 'accident'],
                            'testimonials': ['review', 'testimonial', 'feedback'],
                            'general_help': ['help', 'what can you', 'services']
                        }
                        
                        if intent in keywords:
                            for keyword in keywords[intent]:
                                if keyword in message_lower:
                                    score += 0.5  # Higher weight for exact keywords
                    except Exception:
                        # Skip keyword matching if it fails
                        pass
                    
                    if score > 0:
                        intent_scores[intent] = score
                except Exception:
                    # Skip invalid intents/patterns
                    continue
            
            # Add car sales and sell patterns
            try:
                car_sales_keywords = ['buy', 'purchase', 'car sales', 'buying', 'finance']
                car_sell_keywords = ['sell', 'selling', 'trade in', 'trade-in', 'valuation', 'value my car']
                make_claim_keywords = ['claim', 'accident', 'make a claim', 'file claim', 'replacement vehicle']
                services_keywords = ['services', 'what we do', 'what do you offer', 'personal assistance', 'introducer']
                
                if any(keyword in message_lower for keyword in car_sales_keywords):
                    intent_scores['car_sales'] = intent_scores.get('car_sales', 0) + 0.6
                if any(keyword in message_lower for keyword in car_sell_keywords):
                    intent_scores['car_sell'] = intent_scores.get('car_sell', 0) + 0.6
                if any(keyword in message_lower for keyword in make_claim_keywords):
                    intent_scores['make_claim'] = intent_scores.get('make_claim', 0) + 0.6
                if any(keyword in message_lower for keyword in services_keywords):
                    intent_scores['services'] = intent_scores.get('services', 0) + 0.5
            except Exception:
                # Skip keyword matching if it fails
                pass
            
            # Return highest scoring intent
            try:
                if intent_scores:
                    best_intent = max(intent_scores, key=intent_scores.get)
                    confidence = min(intent_scores[best_intent] / 2.0, 1.0)  # Normalize to 0-1
                    return best_intent, confidence
            except Exception:
                # Fallback if max() fails
                pass
            
            # Default to general help if no strong match
            return 'general_help', 0.3
        except Exception as e:
            logger.error(f"Error in classify_intent: {e}", exc_info=True)
            # Ultimate fallback - always return something valid
            return 'general_help', 0.3
    
    def generate_response(self, message: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Generate response based on rule-based matching.
        Returns dict with message, intent, and confidence.
        NEVER throws exceptions - always returns a valid response.
        """
        try:
            if not message or not message.strip():
                return {
                    'message': "I'm here to help! Please let me know what you need assistance with.",
                    'intent': 'unclear',
                    'confidence': 0.0,
                    'collected_data': {},
                    'is_lead': False,
                    'response_time_ms': 50
                }
            
            message_clean = message.strip()
            
            # Classify intent (already has exception handling)
            try:
                intent, confidence = self.classify_intent(message_clean)
            except Exception as e:
                logger.error(f"Error classifying intent: {e}", exc_info=True)
                intent, confidence = 'general_help', 0.3
            
            # Get appropriate response (guidance-focused, no data extraction)
            try:
                response_text = self._get_response_for_intent(intent, message_clean, conversation_history)
            except Exception as e:
                logger.error(f"Error getting response for intent: {e}", exc_info=True)
                response_text = "I'm here to help with car hire and related services. How can I assist you today?"
            
            # Simple lead detection based on intent only (no data extraction)
            try:
                is_lead = intent in ['booking', 'pricing', 'contact', 'vehicle_types', 'delivery', 'car_sales', 'car_sell', 'make_claim']
            except Exception:
                is_lead = False
            
            return {
                'message': response_text,
                'intent': intent,
                'confidence': confidence,
                'collected_data': {},  # No data extraction in rule-based mode
                'is_lead': is_lead,
                'response_time_ms': 50  # Fast response time for rule-based
            }
        except Exception as e:
            logger.error(f"Critical error in generate_response: {e}", exc_info=True)
            # Ultimate fallback - always return a valid response
            return {
                'message': "I'm here to help with car hire and related services. How can I assist you today?",
                'intent': 'general_help',
                'confidence': 0.3,
                'collected_data': {},
                'is_lead': False,
                'response_time_ms': 50
            }
    
    def _get_response_for_intent(self, intent: str, message: str, conversation_history: List[Dict] = None) -> str:
        """
        Get appropriate response for classified intent.
        NEVER throws exceptions - always returns a valid string.
        """
        try:
            if not intent:
                intent = 'general_help'
            
            message_lower = message.lower() if message else ''
            
            # Check if intent exists in context patterns
            try:
                if intent in self.context_patterns:
                    responses = self.context_patterns[intent].get('responses', [])
                    if responses:
                        return responses[0]
            except Exception:
                pass
            
            # Handle special cases
            try:
                if intent == 'unclear':
                    # Check if it's a very short message
                    if len(message.split()) <= 2:
                        return "I'm here to help! Could you tell me more about what you need? For example, are you looking to book a vehicle, get pricing information, or have questions about our services?"
                    unclear_responses = self.responses.get('unclear', [])
                    if unclear_responses:
                        return unclear_responses[0]
            except Exception:
                pass
            
            # Default response
            try:
                default_responses = self.responses.get('default', [])
                if default_responses:
                    return default_responses[0]
            except Exception:
                pass
            
            # Ultimate fallback
            return "I'm here to help with car hire and related services. How can I assist you today?"
        except Exception as e:
            logger.error(f"Error in _get_response_for_intent: {e}", exc_info=True)
            # Ultimate fallback - always return something
            return "I'm here to help with car hire and related services. How can I assist you today?"
    


# Singleton instance
_rule_based_chatbot_instance = None

def get_rule_based_chatbot():
    """
    Get or create the rule-based chatbot instance.
    NEVER throws exceptions - always returns a valid chatbot instance.
    """
    global _rule_based_chatbot_instance
    try:
        if _rule_based_chatbot_instance is None:
            _rule_based_chatbot_instance = RuleBasedChatbot()
        return _rule_based_chatbot_instance
    except Exception as e:
        logger.error(f"Error creating rule-based chatbot instance: {e}", exc_info=True)
        # Return a minimal fallback instance
        try:
            return RuleBasedChatbot()
        except Exception:
            # If even that fails, return a dummy object with generate_response
            class FallbackChatbot:
                def generate_response(self, message, conversation_history=None):
                    return {
                        'message': "I'm here to help with car hire and related services. How can I assist you today?",
                        'intent': 'general_help',
                        'confidence': 0.3,
                        'collected_data': {},
                        'is_lead': False,
                        'response_time_ms': 50
                    }
            return FallbackChatbot()

