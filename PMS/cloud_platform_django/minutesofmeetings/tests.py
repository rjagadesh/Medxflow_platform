from django.test import TestCase

# Create your tests here.


v = [
    ("templateA", "datetime_value"),
    ("templateB", "datetime_value"),
    ("templateC", "datetime_value")
]

data = []
for x,y in v:
    single_val = {"template_name": x, "datetime_value": y}
    data.append(single_val)


print(data)