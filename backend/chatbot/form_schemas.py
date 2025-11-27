"""
Form schemas and validation rules for all user-fillable forms
Used by the Re-Act agent for intelligent form collection
"""

from typing import Dict, Any, List

# Form Schemas with validation rules
FORM_SCHEMAS = {
    'contact': {
        'title': 'Contact Inquiry',
        'description': 'General contact form for inquiries',
        'endpoint': 'inquiriesApi.create',
        'required_fields': ['full_name', 'email', 'subject', 'message'],
        'optional_fields': ['phone'],
        'validation': {
            'full_name': {'type': 'string', 'min_length': 2, 'max_length': 100},
            'email': {'type': 'email'},
            'phone': {'type': 'phone', 'optional': True},
            'subject': {'type': 'string', 'min_length': 5, 'max_length': 200},
            'message': {'type': 'text', 'min_length': 10, 'max_length': 1000}
        }
    },

    'make_claim': {
        'title': 'Accident Claim',
        'description': 'Submit vehicle accident claims',
        'endpoint': 'bookingsApi.submitClaim',
        'required_fields': [
            'first_name', 'last_name', 'email', 'phone', 'full_address',
            'accident_date', 'vehicle_registration', 'insurance_company',
            'policy_number', 'accident_details', 'pickup_location', 'dropoff_location'
        ],
        'optional_fields': ['additional_notes', 'documents'],
        'validation': {
            'first_name': {'type': 'string', 'min_length': 2, 'max_length': 50},
            'last_name': {'type': 'string', 'min_length': 2, 'max_length': 50},
            'email': {'type': 'email'},
            'phone': {'type': 'phone'},
            'full_address': {'type': 'text', 'min_length': 10, 'max_length': 500},
            'accident_date': {'type': 'date'},
            'vehicle_registration': {'type': 'string', 'pattern': r'^[A-Z0-9]{1,10}$'},
            'insurance_company': {'type': 'string', 'min_length': 2, 'max_length': 100},
            'policy_number': {'type': 'string', 'min_length': 5, 'max_length': 50},
            'accident_details': {'type': 'text', 'min_length': 20, 'max_length': 1000},
            'pickup_location': {'type': 'location'},
            'dropoff_location': {'type': 'location'},
            'additional_notes': {'type': 'text', 'max_length': 500, 'optional': True},
            'documents': {'type': 'file', 'optional': True}
        }
    },

    'testimonial': {
        'title': 'Customer Testimonial',
        'description': 'Submit customer feedback and testimonials',
        'endpoint': 'testimonialsApi.create',
        'required_fields': ['full_name', 'feedback', 'rating'],
        'optional_fields': ['service_used'],
        'validation': {
            'full_name': {'type': 'string', 'min_length': 2, 'max_length': 100},
            'service_used': {
                'type': 'select',
                'options': ['Car Hire', 'Car Rental', 'Claims Management', 'Car Purchase/Sale'],
                'optional': True
            },
            'feedback': {'type': 'text', 'min_length': 10, 'max_length': 1000},
            'rating': {'type': 'integer', 'min': 1, 'max': 5}
        }
    },

    'newsletter_subscribe': {
        'title': 'Newsletter Subscription',
        'description': 'Subscribe to newsletter',
        'endpoint': 'newsletterApi.subscribe',
        'required_fields': ['email'],
        'optional_fields': [],
        'validation': {
            'email': {'type': 'email'}
        }
    },

    'newsletter_unsubscribe': {
        'title': 'Newsletter Unsubscription',
        'description': 'Unsubscribe from newsletter',
        'endpoint': 'newsletterApi.unsubscribe',
        'required_fields': ['email'],
        'optional_fields': [],
        'validation': {
            'email': {'type': 'email'}
        }
    },

    'car_purchase': {
        'title': 'Car Purchase Request',
        'description': 'Submit interest in purchasing a vehicle',
        'endpoint': 'carSalesApi.submitPurchaseRequest',
        'required_fields': ['name', 'email', 'phone'],
        'optional_fields': ['message', 'offer_price', 'financing_required', 'trade_in_details'],
        'validation': {
            'name': {'type': 'string', 'min_length': 2, 'max_length': 100},
            'email': {'type': 'email'},
            'phone': {'type': 'phone'},
            'message': {'type': 'text', 'max_length': 500, 'optional': True},
            'offer_price': {'type': 'number', 'min': 0, 'optional': True},
            'financing_required': {'type': 'boolean', 'optional': True},
            'trade_in_details': {'type': 'text', 'max_length': 500, 'optional': True}
        }
    },

    'car_sell': {
        'title': 'Sell Vehicle Request',
        'description': 'Submit request to sell a vehicle',
        'endpoint': 'carSalesApi.submitSellRequest',
        'required_fields': ['name', 'vehicle_make', 'vehicle_model'],
        'optional_fields': ['email', 'phone', 'vehicle_year', 'mileage', 'message', 'vehicle_image'],
        'validation': {
            'name': {'type': 'string', 'min_length': 2, 'max_length': 100},
            'email': {'type': 'email', 'optional': True},
            'phone': {'type': 'phone', 'optional': True},
            'vehicle_make': {'type': 'string', 'min_length': 2, 'max_length': 50},
            'vehicle_model': {'type': 'string', 'min_length': 2, 'max_length': 50},
            'vehicle_year': {'type': 'integer', 'min': 1900, 'max': 2030, 'optional': True},
            'mileage': {'type': 'integer', 'min': 0, 'optional': True},
            'message': {'type': 'text', 'max_length': 500, 'optional': True},
            'vehicle_image': {'type': 'file', 'optional': True}
        }
    }
}

# Form Questions - Empathetic and professional question prompts
FORM_QUESTIONS = {
    'contact': {
        'full_name': "May I have your full name please?",
        'email': "What's the best email address to reach you at?",
        'phone': "Would you like to provide a phone number for faster assistance?",
        'subject': "What's the main topic or subject of your inquiry?",
        'message': "Please share any additional details about your inquiry. I'm here to help."
    },

    'make_claim': {
        'first_name': "To get started with your claim, may I have your first name?",
        'last_name': "And your last name please?",
        'email': "What's your email address so we can keep you updated on your claim?",
        'phone': "What's the best phone number to reach you at regarding your claim?",
        'full_address': "Could you please provide your full address for the claim documentation?",
        'accident_date': "When did the accident occur? (Please provide the date)",
        'vehicle_registration': "What's the registration number of the vehicle involved?",
        'insurance_company': "Which insurance company handles your policy?",
        'policy_number': "What's your policy number with them?",
        'accident_details': "Could you please describe what happened in the accident? Any details would be helpful.",
        'pickup_location': "Where would you like us to pick up the replacement vehicle?",
        'dropoff_location': "And where should we deliver it to?",
        'additional_notes': "Is there anything else you'd like to add about your claim?"
    },

    'testimonial': {
        'full_name': "May I have your name for this testimonial?",
        'service_used': "Which of our services have you used? (Car Hire, Car Rental, Claims Management, or Car Purchase/Sale)",
        'feedback': "I'd love to hear about your experience. Please share your feedback with us.",
        'rating': "On a scale of 1-5 stars, how would you rate your experience with us?"
    },

    'newsletter_subscribe': {
        'email': "What's your email address for the newsletter subscription?"
    },

    'newsletter_unsubscribe': {
        'email': "What's the email address you'd like to unsubscribe from our newsletter?"
    },

    'car_purchase': {
        'name': "May I have your full name for this purchase inquiry?",
        'email': "What's your email address so we can discuss the vehicle details?",
        'phone': "And your phone number for any immediate questions?",
        'message': "Is there anything specific you'd like to know about this vehicle?",
        'offer_price': "Do you have an offer price in mind for this vehicle?",
        'financing_required': "Are you interested in financing options for this purchase?",
        'trade_in_details': "Do you have a vehicle you'd like to trade in?"
    },

    'car_sell': {
        'name': "May I have your name for this vehicle sale inquiry?",
        'email': "What's your email address so we can discuss the valuation?",
        'phone': "And your phone number for coordination?",
        'vehicle_make': "What's the make of the vehicle you'd like to sell?",
        'vehicle_model': "And the model?",
        'vehicle_year': "What year was it manufactured?",
        'mileage': "What's the current mileage on the vehicle?",
        'message': "Is there anything specific you'd like to tell us about the vehicle?"
    }
}

# Form flow definitions - defines the order and grouping of questions
FORM_FLOWS = {
    'contact': {
        'groups': [
            {'name': 'personal', 'fields': ['full_name', 'email', 'phone']},
            {'name': 'inquiry', 'fields': ['subject', 'message']}
        ]
    },

    'make_claim': {
        'groups': [
            {'name': 'personal', 'fields': ['first_name', 'last_name', 'email', 'phone', 'full_address']},
            {'name': 'accident', 'fields': ['accident_date', 'vehicle_registration', 'insurance_company', 'policy_number', 'accident_details']},
            {'name': 'logistics', 'fields': ['pickup_location', 'dropoff_location', 'additional_notes']}
        ]
    },

    'testimonial': {
        'groups': [
            {'name': 'basic', 'fields': ['full_name', 'service_used']},
            {'name': 'feedback', 'fields': ['feedback', 'rating']}
        ]
    },

    'newsletter_subscribe': {
        'groups': [
            {'name': 'subscription', 'fields': ['email']}
        ]
    },

    'newsletter_unsubscribe': {
        'groups': [
            {'name': 'unsubscription', 'fields': ['email']}
        ]
    },

    'car_purchase': {
        'groups': [
            {'name': 'contact', 'fields': ['name', 'email', 'phone']},
            {'name': 'interest', 'fields': ['message', 'offer_price', 'financing_required', 'trade_in_details']}
        ]
    },

    'car_sell': {
        'groups': [
            {'name': 'contact', 'fields': ['name', 'email', 'phone']},
            {'name': 'vehicle', 'fields': ['vehicle_make', 'vehicle_model', 'vehicle_year', 'mileage', 'message']}
        ]
    }
}

def get_form_schema(form_type: str) -> Dict[str, Any]:
    """Get schema for a specific form type"""
    return FORM_SCHEMAS.get(form_type, {})

def get_form_questions(form_type: str) -> Dict[str, str]:
    """Get questions for a specific form type"""
    return FORM_QUESTIONS.get(form_type, {})

def get_form_flow(form_type: str) -> Dict[str, Any]:
    """Get flow definition for a specific form type"""
    return FORM_FLOWS.get(form_type, {})

def validate_field_value(field_name: str, value: Any, form_type: str) -> Dict[str, Any]:
    """Validate a field value against its schema"""

    if form_type not in FORM_SCHEMAS:
        return {'valid': False, 'error': 'Unknown form type'}

    schema = FORM_SCHEMAS[form_type]
    field_schema = schema['validation'].get(field_name)

    if not field_schema:
        return {'valid': False, 'error': 'Unknown field'}

    # Check if field is optional and value is empty
    if field_schema.get('optional', False) and (value is None or value == ''):
        return {'valid': True}

    # Type validation
    field_type = field_schema.get('type')

    if field_type == 'string':
        if not isinstance(value, str):
            return {'valid': False, 'error': 'Must be text'}
        if 'min_length' in field_schema and len(value.strip()) < field_schema['min_length']:
            return {'valid': False, 'error': f'Must be at least {field_schema["min_length"]} characters'}
        if 'max_length' in field_schema and len(value.strip()) > field_schema['max_length']:
            return {'valid': False, 'error': f'Must be no more than {field_schema["max_length"]} characters'}

    elif field_type == 'email':
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, str(value)):
            return {'valid': False, 'error': 'Invalid email format'}

    elif field_type == 'phone':
        # Basic phone validation - allow various formats
        if not str(value).replace(' ', '').replace('-', '').replace('+', '').isdigit():
            return {'valid': False, 'error': 'Invalid phone format'}

    elif field_type == 'integer':
        try:
            int_val = int(value)
            if 'min' in field_schema and int_val < field_schema['min']:
                return {'valid': False, 'error': f'Must be at least {field_schema["min"]}'}
            if 'max' in field_schema and int_val > field_schema['max']:
                return {'valid': False, 'error': f'Must be no more than {field_schema["max"]}'}
        except ValueError:
            return {'valid': False, 'error': 'Must be a number'}

    elif field_type == 'number':
        try:
            float(value)
        except ValueError:
            return {'valid': False, 'error': 'Must be a number'}

    elif field_type == 'boolean':
        if str(value).lower() not in ['true', 'false', 'yes', 'no', '1', '0']:
            return {'valid': False, 'error': 'Must be yes/no'}

    elif field_type == 'select':
        if value not in field_schema.get('options', []):
            return {'valid': False, 'error': f'Must be one of: {", ".join(field_schema["options"])}'}

    return {'valid': True}

def get_next_required_field(form_type: str, completed_fields: List[str]) -> str:
    """Get the next required field that hasn't been completed"""

    if form_type not in FORM_SCHEMAS:
        return None

    required_fields = FORM_SCHEMAS[form_type]['required_fields']

    for field in required_fields:
        if field not in completed_fields:
            return field

    return None

def is_form_complete(form_type: str, collected_data: Dict[str, Any]) -> bool:
    """Check if all required fields for a form have been collected"""

    if form_type not in FORM_SCHEMAS:
        return False

    required_fields = FORM_SCHEMAS[form_type]['required_fields']

    for field in required_fields:
        if field not in collected_data or not collected_data[field]:
            return False

    return True
