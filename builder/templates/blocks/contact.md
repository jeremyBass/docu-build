
<!-- CONTACT INFO: Adjust the sample contact info below to reflect appropriate contact information. -->
<div id="contact-details" itemscope itemtype="http://schema.org/Organization"> 
	<span itemprop="department"  content="{{ globals.contact.department }}"></span> 
	<span itemprop="name" content="{{ globals.contact.name }}"></span> 
	<div itemprop="address" itemscope itemtype="http://schema.org/PostalAddress">
		<span itemprop="location" content="{{ globals.contact.location }}"></span>
		<span itemprop="streetAddress" content="{{ globals.contact.streetAddress }}"></span>
		<span itemprop="addressLocality" content="{{ globals.contact.addressLocality }}"></span>
		<span itemprop="addressRegion" content="{{ globals.contact.addressRegion }}"></span>
		<span itemprop="postalCode" content="{{ globals.contact.postalCode }}"></span>
	</div>
	<span itemprop="telephone" content="{{ globals.contact.telephone }}"></span>
	<span itemprop="email" content="{{ globals.contact.email }}"></span>
	<span itemprop="contactPoint" content="{{ globals.contact.contactPoint }}"></span>
	<span itemprop="url" content="{{ globals.contact.url }}"></span>
</div>

