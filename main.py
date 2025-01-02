import json
from queue import Queue
from datetime import datetime, timedelta
import time
import os
import sys
import random
import re, unicodedata
from config import *
from zlapi.models import *
from szl import CommandHandler
from zlapi import ZaloAPI
from colorama import Fore, Style, init
from logging_utils import Logging
from datetime import datetime
import threading
import requests
from requests.adapters import HTTPAdapter

import pyfiglet


from requests.packages.urllib3.util.retry import Retry
import os

logger = Logging()

colors1 = [
    "FF9900", "FFFF33", "33FFFF", "FF99FF", "FF3366", "FFFF66", "FF00FF", "66FF99", "00CCFF", 
    "FF0099", "FF0066", "0033FF", "FF9999", "00FF66", "00FFFF", "CCFFFF", "8F00FF", "FF00CC", 
    "FF0000", "FF1100", "FF3300", "FF4400", "FF5500", "FF6600", "FF7700", "FF8800", "FF9900", 
    "FFaa00", "FFbb00", "FFcc00", "FFdd00", "FFee00", "FFff00", "FFFFFF", "FFEBCD", "F5F5DC", 
    "F0FFF0", "F5FFFA", "F0FFFF", "F0F8FF", "FFF5EE", "F5F5F5"
]

text = "I'm Soiz"
Soizl = pyfiglet.figlet_format(text)
print(Soizl)

colors = [
    "FF9900", "FFFF33", "33FFFF", "FF99FF", "FF3366", 
    "FFFF66", "FF00FF", "66FF99", "00CCFF", "FF0099", 
    "FF0066", "0033FF", "FF9999", "00FF66", "00FFFF", 
    "CCFFFF", "8F00FF", "FF00CC", "FF0000", "FF1100", 
    "FF3300"
]

def hex_to_ansi(hex_color):
    hex_color = hex_color.lstrip('#')
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return f'\033[38;2;{r};{g};{b}m'

class Client(ZaloAPI):
    def __init__(self, api_key, secret_key, imei, session_cookies, reset_interval=3600):
        super().__init__(api_key, secret_key, imei=imei, session_cookies=session_cookies)
        self.command_handler = CommandHandler(self)
        self.group_info_cache = {}
        self.session = requests.Session()
        self.message_queue = Queue()
        self.processed_messages = set()
        self.response_time_limit = timedelta(seconds=70)  
        self.is_mute_list = {}
        
        self.last_sms_times = {}
        retry_strategy = Retry(
            total=5,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)





        all_group = self.fetchAllGroups()
        
        allowed_thread_ids = list(all_group.gridVerMap.keys())

    def send_request(self, url):
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Lỗi request: {e}")
            return None

    def onLoggedIn(self, phone=None):
        self.uid = self._state.user_id
        logger.logged(f"with uid: {self.uid}")
        try:
            handle_bot_admin(self)
            logger.added(f"Đã thêm 👑{get_user_name_by_id(self, self.uid)} 🆔 {self.uid} cho lần đầu tiên khởi động vào danh sách ADMIN_BOT ✅")
        except Exception as e:
            logger.error(f"{str(e)}")
    
    def onMessage(self, mid, author_id, message, message_object, thread_id, thread_type):
        try:
            message_text = message.text if isinstance(message, Message) else str(message)
            author_info = self.fetchUserInfo(author_id).changed_profiles.get(author_id, {})
            author_name = author_info.get('zaloName', 'Không xác định')

            group_info = self.fetchGroupInfo(thread_id)
            group_name = group_info.gridInfoMap.get(thread_id, {}).get('name', 'N/A')

            current_time = time.strftime("%H:%M:%S - %d/%m/%Y", time.localtime())

            colors_selected = random.sample(colors, 8)
            print(f"{hex_to_ansi(colors_selected[0])}{Style.BRIGHT}------------------------------{Style.RESET_ALL}")
            print(f"{hex_to_ansi(colors_selected[1])}{Style.BRIGHT}- Message: {message_text}{Style.RESET_ALL}")
            print(f"{hex_to_ansi(colors_selected[2])}{Style.BRIGHT}- ID NGƯỜI DÙNG: {author_id}{Style.RESET_ALL}")
            print(f"{hex_to_ansi(colors_selected[6])}{Style.BRIGHT}- TÊN NGƯỜI DÙNG: {author_name}{Style.RESET_ALL}")
            print(f"{hex_to_ansi(colors_selected[3])}{Style.BRIGHT}- ID NHÓM: {thread_id}{Style.RESET_ALL}")
            print(f"{hex_to_ansi(colors_selected[4])}{Style.BRIGHT}- TÊN NHÓM: {group_name}{Style.RESET_ALL}")
            print(f"{hex_to_ansi(colors_selected[5])}{Style.BRIGHT}- TYPE: {thread_type}{Style.RESET_ALL}")
            print(f"{hex_to_ansi(colors_selected[7])}{Style.BRIGHT}- THỜI GIAN NHẬN ĐƯỢC: {current_time}{Style.RESET_ALL}")
            print(f"{hex_to_ansi(colors_selected[0])}{Style.BRIGHT}------------------------------{Style.RESET_ALL}")
            

            if isinstance(message, str):
                self.command_handler.handle_command(message, author_id, message_object, thread_id, thread_type)
                if self.is_mute_list.get(thread_id):
                   if author_id in self.is_mute_list[thread_id]:
                    self.deleteGroupMsg(message_object.msgId, message_object.uidFrom, message_object.cliMsgId, thread_id)
        except Exception as e:
         logger.error(f"Lỗi xử lý tin nhắn: {e}")

if __name__ == "__main__":
    try:
        client = Client(API_KEY, SECRET_KEY, IMEI, SESSION_COOKIES)
        client.listen(thread=True)
    except Exception as e:
        logger.error(f"Lỗi khởi tạo client: {e}")
        time.sleep(10)