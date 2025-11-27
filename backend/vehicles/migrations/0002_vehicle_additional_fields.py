from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vehicles', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicle',
            name='color',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='daily_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='fuel_type',
            field=models.CharField(
                choices=[('petrol', 'Petrol'), ('diesel', 'Diesel'), ('hybrid', 'Hybrid'), ('electric', 'Electric')],
                default='petrol',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='manufacturer',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='model',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='seats',
            field=models.PositiveIntegerField(default=4),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='transmission',
            field=models.CharField(choices=[('automatic', 'Automatic'), ('manual', 'Manual')], default='automatic', max_length=20),
        ),
    ]


