import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaPinterest } from 'react-icons/fa';
import { RiCustomerService2Fill } from 'react-icons/ri';
import { IoMdMail } from 'react-icons/io';
import { BsTelephoneFill, BsArrowUpCircle } from 'react-icons/bs';
import { HiLocationMarker } from 'react-icons/hi';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      {/* <div className="bg-orange-600 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <IoMdMail className="text-3xl mr-4" />
              <div>
                <h3 className="text-xl font-bold">Subscribe to our Newsletter</h3>
                <p>Get the latest updates on offers and promotions</p>
              </div>
            </div>
            <div className="flex w-full md:w-auto">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="px-4 py-3 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 w-full md:w-auto"
              />
              <button className="bg-indigo-900 hover:bg-indigo-800 px-6 py-3 rounded-r-lg font-medium transition duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-6">Daily Mart</h3>
            <p className="mb-4 text-gray-300">Your one-stop online shopping destination for daily needs. Quality products at affordable prices.</p>
            <div className="flex space-x-4">
              <a href="#" className="bg-gray-800 hover:bg-orange-600 p-3 rounded-full transition duration-300">
                <FaFacebookF />
              </a>
              <a href="#" className="bg-gray-800 hover:bg-orange-600 p-3 rounded-full transition duration-300">
                <FaTwitter />
              </a>
              <a href="#" className="bg-gray-800 hover:bg-orange-600 p-3 rounded-full transition duration-300">
                <FaInstagram />
              </a>
              <a href="#" className="bg-gray-800 hover:bg-orange-600 p-3 rounded-full transition duration-300">
                <FaLinkedinIn />
              </a>
              <a href="#" className="bg-gray-800 hover:bg-orange-600 p-3 rounded-full transition duration-300">
                <FaPinterest />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Home</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Shop</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">About Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Contact</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">FAQ</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xl font-bold mb-6">Categories</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Groceries</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Electronics</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Home & Kitchen</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Beauty & Health</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Baby Care</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Sports & Fitness</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <HiLocationMarker className="text-xl mr-3 mt-1 text-orange-400" />
                <span className="text-gray-300">123 Shopping Street, Retail District, Market City</span>
              </li>
              <li className="flex items-center">
                <BsTelephoneFill className="text-lg mr-3 text-orange-400" />
                <span className="text-gray-300">+1 (234) 567-8900</span>
              </li>
              <li className="flex items-center">
                <IoMdMail className="text-xl mr-3 text-orange-400" />
                <span className="text-gray-300">support@dailymart.com</span>
              </li>
              <li className="flex items-center">
                <RiCustomerService2Fill className="text-xl mr-3 text-orange-400" />
                <span className="text-gray-300">24/7 Customer Support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods & Copyright */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} Daily Mart. All rights reserved.
            </p>
            <div className="flex items-center">
              <span className="text-gray-400 mr-3 text-sm">We accept:</span>
              <div className="flex space-x-2">
                <div className="bg-white rounded-sm p-1">
                  <span className="text-xs font-bold text-gray-800 px-1">VISA</span>
                </div>
                <div className="bg-white rounded-sm p-1">
                  <span className="text-xs font-bold text-gray-800 px-1">MC</span>
                </div>
                <div className="bg-white rounded-sm p-1">
                  <span className="text-xs font-bold text-gray-800 px-1">PayPal</span>
                </div>
                <div className="bg-white rounded-sm p-1">
                  <span className="text-xs font-bold text-gray-800 px-1">AMEX</span>
                </div>
              </div>
            </div>
            {/* <button 
              onClick={scrollToTop}
              className="hidden md:flex items-center text-orange-400 hover:text-orange-300 transition duration-300 mt-4 md:mt-0"
            >
              Back to top
              <BsArrowUpCircle className="ml-2 text-lg" />
            </button> */}
          </div>
        </div>
      </div>
    </footer>
  );
}