from rest_framework import serializers

from .models import Claim, ClaimDocument


class ClaimDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ClaimDocument
        fields = '__all__'

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return None


class ClaimSerializer(serializers.ModelSerializer):
    documents = ClaimDocumentSerializer(many=True, read_only=True)
    vehicle_details = serializers.SerializerMethodField()

    class Meta:
        model = Claim
        fields = '__all__'

    def get_vehicle_details(self, obj):
        if obj.vehicle:
            return {
                'id': obj.vehicle.id,
                'name': obj.vehicle.name,
                'registration': obj.vehicle.registration,
                'type': obj.vehicle.type,
            }
        return None


class ClaimCreateSerializer(serializers.ModelSerializer):
    documents = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Claim
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'address',
            'accident_date', 'vehicle_registration', 'insurance_company',
            'policy_number', 'accident_details', 'pickup_location',
            'drop_location', 'notes', 'documents'
        ]

    def create(self, validated_data):
        documents = validated_data.pop('documents', [])
        claim = Claim.objects.create(**validated_data)

        for doc_file in documents:
            ClaimDocument.objects.create(
                claim=claim,
                file=doc_file,
                file_name=doc_file.name
            )

        from utils.email import send_claim_confirmation
        send_claim_confirmation(
            claim.email,
            {
                'id': claim.id,
                'first_name': claim.first_name,
                'last_name': claim.last_name,
                'created_at': claim.created_at,
            }
        )

        return claim



