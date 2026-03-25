from django.db import models


class ProfessionalCategory(models.Model):
	category_name = models.CharField(max_length=100, unique=True)

	class Meta:
		managed = False
		db_table = "Professional_Category"
		ordering = ["category_name"]
		verbose_name = "Professional Category"
		verbose_name_plural = "Professional Categories"

	def __str__(self):
		return self.category_name


class WebsiteScrapingSource(models.Model):
	website_name = models.CharField(max_length=32, unique=True)
	website_full_name = models.CharField(max_length=255)
	start_url = models.CharField(max_length=2048)
	professional_category = models.ForeignKey(
		ProfessionalCategory,
		on_delete=models.DO_NOTHING,
		db_column="professional_category_id",
		null=True,
		blank=True,
		related_name="sources",
	)
	active = models.BooleanField(default=True)
	created_at = models.DateTimeField(null=True, blank=True)
	updated_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		managed = False
		db_table = "Website_Scraping_Sources"
		ordering = ["website_name"]
		verbose_name = "Website Source"
		verbose_name_plural = "Website Sources"

	def __str__(self):
		return f"{self.website_name} - {self.website_full_name}"


class WebsiteScrapingSelector(models.Model):
	website_name = models.CharField(max_length=32)
	selector_key = models.CharField(max_length=128)
	selector_value = models.CharField(max_length=1024)
	created_at = models.DateTimeField(null=True, blank=True)
	updated_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		managed = False
		db_table = "Website_Scraping_Selectors"
		ordering = ["website_name", "selector_key"]
		verbose_name = "Website Selector"
		verbose_name_plural = "Website Selectors"
		unique_together = (("website_name", "selector_key"),)

	def __str__(self):
		return f"{self.website_name}.{self.selector_key}"


class WebsiteScrapingData(models.Model):
	title = models.CharField(max_length=700)
	category = models.CharField(max_length=64, default="Notification")
	website_name = models.CharField(max_length=32)
	detail_url = models.CharField(max_length=2048, null=True, blank=True)
	notice_date = models.CharField(max_length=64, null=True, blank=True)
	due_date = models.CharField(max_length=64, default="-")
	pdf_url = models.CharField(max_length=2048, null=True, blank=True)
	processed = models.BooleanField(default=False)
	summary = models.TextField(null=True, blank=True)
	created_at = models.DateTimeField(null=True, blank=True)
	updated_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		managed = False
		db_table = "Website_Scraping_data"
		ordering = ["-created_at", "-id"]
		verbose_name = "Website Scraping Data"
		verbose_name_plural = "Website Scraping Data"

	def __str__(self):
		return f"{self.website_name} - {self.title[:80]}"


class WebsiteScrapingRun(models.Model):
	started_at = models.DateTimeField(null=True, blank=True)
	finished_at = models.DateTimeField(null=True, blank=True)
	status = models.CharField(max_length=16)
	total_new_rows = models.IntegerField(default=0)
	error_text = models.TextField(null=True, blank=True)
	created_at = models.DateTimeField(null=True, blank=True)
	updated_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		managed = False
		db_table = "Website_Scraping_Runs"
		ordering = ["-started_at", "-id"]
		verbose_name = "Website Scraping Run"
		verbose_name_plural = "Website Scraping Runs"

	def __str__(self):
		status = self.status or "unknown"
		return f"Run {self.id} ({status})"


class WebsiteScrapingRunSiteStat(models.Model):
	run = models.ForeignKey(
		WebsiteScrapingRun,
		on_delete=models.DO_NOTHING,
		db_column="run_id",
		related_name="site_stats",
	)
	website_name = models.CharField(max_length=32)
	new_rows = models.IntegerField(default=0)
	created_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		managed = False
		db_table = "Website_Scraping_Run_Site_Stats"
		ordering = ["-new_rows", "website_name"]
		verbose_name = "Website Scraping Run Site Stat"
		verbose_name_plural = "Website Scraping Run Site Stats"

	def __str__(self):
		return f"Run {self.run_id} - {self.website_name}: {self.new_rows}"


class UserFeedback(models.Model):
	full_name = models.CharField(max_length=150)
	user_email = models.EmailField(max_length=254)
	star_rating = models.PositiveSmallIntegerField()
	type_of_feedback = models.CharField(max_length=32)
	message = models.TextField()
	created_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		managed = False
		db_table = "User_Feedback"
		ordering = ["-created_at", "-id"]
		verbose_name = "User Feedback"
		verbose_name_plural = "User Feedback"

	def __str__(self):
		return f"{self.user_email} ({self.star_rating}★) - {self.type_of_feedback}"
