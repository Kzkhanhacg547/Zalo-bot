import os
import importlib
import sys
import subprocess
import random
import time
import json
import datetime
import pytz
import threading
from zlapi._message import Mention
from zlapi.models import Message
from zlapi.models import *
from config import *
from logging_utils import Logging
from colorama import Fore
settings = read_settings()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'modules/auto'))

logger = Logging()

def prf():
    with open('setting.json', 'r') as f:
        return json.load(f).get('prefix')

def load_duyetbox_data():
    try:
        with open('modules/cache/duyetboxdata.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

class CommandHandler:
    def __init__(self, client):
        self.client = client
        self.szl = self.load_szl()
        self.noprefix_szl = self.load_noprefix_szl()
        self.auto_szl = self.load_auto_szl()
        self.adminon = self.load_admin_mode()

        if PREFIX == '':
            logger.prefixcmd("Prefix hiện tại của bot là 'no prefix'")
        else:
            logger.prefixcmd(f"Prefix hiện tại của bot là '{PREFIX}'")

    def load_admin_mode(self):
        try:
            with open('modules/cacheadmindata.json', 'r') as f:
                data = json.load(f)
                return data.get('adminon', False)
        except FileNotFoundError:
            return False
        except json.JSONDecodeError:
            return False

    def save_admin_mode(self):
        with open('modules/cache/admindata.json', 'w') as f:
            json.dump({'adminon': self.adminon}, f)

    def hex_to_rgb(self, hex_color):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def rgb_to_hex(self, rgb_color):
        return '{:02x}{:02x}{:02x}'.format(*rgb_color)

    def generate_random_color(self):
        return "#{:06x}".format(random.randint(0, 0xFFFFFF))

    def generate_gradient_colors(self, length, num_colors=5):
        random_colors = [self.generate_random_color() for _ in range(num_colors)]
        rgb_colors = [self.hex_to_rgb(color) for color in random_colors]

        colors = []
        for j in range(num_colors - 1):
            start_rgb = rgb_colors[j]
            end_rgb = rgb_colors[j + 1]
            segment_length = length // (num_colors - 1)
            
            for i in range(segment_length):
                interpolated_color = (
                    int(start_rgb[0] + (end_rgb[0] - start_rgb[0]) * i / (segment_length - 1)),
                    int(start_rgb[1] + (end_rgb[1] - start_rgb[1]) * i / (segment_length - 1)),
                    int(start_rgb[2] + (end_rgb[2] - start_rgb[2]) * i / (segment_length - 1))
                )
                colors.append(self.rgb_to_hex(interpolated_color))
        
        return colors

    def create_rainbow_params(self, text, size=20):
        styles = []
        colors = self.generate_gradient_colors(len(text), num_colors=5)
        
        for i, color in enumerate(colors):
            styles.append({"start": i, "len": 1, "st": f"c_{color}"})
        
        params = {"styles": styles, "ver": 0}
        return json.dumps(params)

    def sendMessageColor(self, error_message, thread_id, thread_type):
        stype = self.create_rainbow_params(error_message)
        mes = Message(
            text=error_message,
            style=stype
        )
        self.client.send(mes, thread_id, thread_type)

    def replyMessageColor(self, error_message, message_object, thread_id, thread_type):
        stype = self.create_rainbow_params(error_message)
        mes = Message(
            text=error_message,
            style=stype
        )
        self.client.replyMessage(mes, message_object, thread_id=thread_id, thread_type=thread_type, ttl=5000)

    def load_szl(self):
        szl = {}
        modules_path = 'modules'
        success_count = 0
        failed_count = 0
        success_szl = []
        failed_szl = []

        for filename in os.listdir(modules_path):
            if filename.endswith('.py') and filename != '__init__.py':
                module_name = filename[:-3]
                try:
                    module = importlib.import_module(f'{modules_path}.{module_name}')
                    
                    if hasattr(module, 'get_szl'):
                        if hasattr(module, 'des'):
                            des = getattr(module, 'des')
                            if all(key in des for key in ['version', 'credits', 'description']):
                                szl.update(module.get_szl())
                                success_count += 1
                                success_szl.append(module_name)
                            else:
                                raise ImportError(f"Lỗi không thể tìm thấy thông tin của lệnh: {module_name}")
                        else:
                            raise ImportError(f"Lệnh {module_name} không có thông tin")
                    else:
                        raise ImportError(f"Module {module_name} không có hàm gọi lệnh")
                except Exception as e:
                    logger.error(f"Không thể load được module: {module_name}. Lỗi: {e}")
                    failed_count += 1
                    failed_szl.append(module_name)

        if success_count > 0:
            logger.success(f"Đã load thành công {success_count} lệnh")
        if failed_count > 0:
            logger.warning(f"Không thể load được {failed_count} lệnh: {', '.join(failed_szl)}")

        return szl

    def load_noprefix_szl(self):
        noprefix_szl = {}
        noprefix_modules_path = 'modules.noprefix'
        success_count = 0
        failed_count = 0
        success_noprefix_szl = []
        failed_noprefix_szl = []

        for filename in os.listdir('modules/noprefix'):
            if filename.endswith('.py') and filename != '__init__.py':
                module_name = filename[:-3]
                try:
                    module = importlib.import_module(f'{noprefix_modules_path}.{module_name}')
                    
                    if hasattr(module, 'get_szl'):
                        if hasattr(module, 'des'):
                            des = getattr(module, 'des')
                            if all(key in des for key in ['version', 'credits', 'description']):
                                noprefix_szl.update(module.get_szl())
                                success_count += 1
                                success_noprefix_szl.append(module_name)
                            else:
                                raise ImportError(f"Module {module_name} thiếu các thông tin cần thiết")
                        else:
                            raise ImportError(f"Lệnh {module_name} không có thông tin")
                    else:
                        raise ImportError(f"Module {module_name} không có hàm gọi lệnh")
                except Exception as e:
                    logger.error(f"Không thể load được module: {module_name}. Lỗi: {e}")
                    failed_count += 1
                    failed_noprefix_szl.append(module_name)

        if success_count > 0:
            logger.success(f"Đã load thành công {success_count} lệnh noprefix")
        if failed_count > 0:
            logger.warning(f"Không thể load được {failed_count} lệnh noprefix: {', '.join(failed_noprefix_szl)}")

        return noprefix_szl

    def load_auto_szl(self):
        auto_szl = {}
        auto_modules_path = 'modules/auto'
        success_count = 0
        failed_count = 0
        success_auto_szl = []
        failed_auto_szl = []

        for filename in os.listdir(auto_modules_path):
            if filename.endswith('.py') and filename != '__init__.py':
                module_name = filename[:-3]
                try:
                    module = importlib.import_module(f'modules.auto.{module_name}')
                    
                    if hasattr(module, 'start_auto'):
                        auto_szl[module_name] = module
                        success_count += 1
                        success_auto_szl.append(module_name)
                    else:
                        raise ImportError(f"Module {module_name} không có hàm start_auto")
                except Exception as e:
                    logger.error(f"Không thể load module auto: {module_name}. Lỗi: {e}")
                    failed_count += 1
                    failed_auto_szl.append(module_name)

        if success_count > 0:
            logger.success(f"Đã load thành công {success_count} lệnh auto")
            for module in success_auto_szl:
                threading.Thread(target=auto_szl[module].start_auto, args=(self.client,)).start()
        if failed_count > 0:
            logger.warning(f"Không thể load {failed_count} lệnh auto: {', '.join(failed_auto_szl)}")

        return auto_szl

    def toggle_admin_mode(self, message, message_object, thread_id, thread_type, author_id):
        if is_admin(author_id):
            if 'on' in message.lower():
                self.adminon = True
                self.save_admin_mode()
                self.replyMessageColor("Chế độ admin đã được bật.", message_object, thread_id, thread_type)
            elif 'off' in message.lower():
                self.adminon = False
                self.save_admin_mode()
                self.replyMessageColor("Chế độ admin đã được tắt.", message_object, thread_id, thread_type)
            else:
                self.replyMessageColor("Vui lòng sử dụng lệnh: adminmode on/off.", message_object, thread_id, thread_type)
        else:
            self.replyMessageColor("Bạn không có quyền bật/tắt chế độ admin.", message_object, thread_id, thread_type)

    def handle_command(self, message, author_id, message_object, thread_id, thread_type):
        if message.lower() in ["hello", "hi", "hai", "chào", "xin chào", "chao", "hí", "híí", "hì", "hìì", "lô", "hii", "helo", "hê nhô"]:
            GREETINGS = [
                "Tốt Lành 🥳", "Vui Vẻ 😄", "Hạnh Phúc ❤", "Yêu Đời 😘", 
                "May Mắn 🍀", "Full Năng Lượng ⚡", "Tuyệt Vời 😁", 
                "Tỉnh Táo 🤓", "Đầy Sức Sống 😽", "Nhiệt Huyết 🔥"
            ]

            tz = pytz.timezone('Asia/Ho_Chi_Minh')
            current_time = datetime.datetime.now(tz).strftime('%H%M')
            hours = int(current_time)

            if 301 <= hours <= 400:
                session = "Sáng Tinh Mơ"
            elif 401 <= hours <= 700:
                session = "Sáng Sớm"
            elif 701 <= hours <= 1000:
                session = "Sáng"
            elif 1001 <= hours <= 1200:
                session = "Trưa"
            elif 1201 <= hours <= 1700:
                session = "Chiều"
            elif 1701 <= hours <= 1800:
                session = "Chiều Tà"
            elif 1801 <= hours <= 2100:
                session = "Tối"
            elif 2101 <= hours or hours <= 300:
                session = "Đêm"
            else:
                session = "Lỗi"

            greeting_text = random.choice(GREETINGS)
            response_text = f"Xin chào! Chúc Bạn Một Buổi {session} {greeting_text}"
            mention = Mention(author_id, length=7, offset=3)

            self.client.replyMessage(
                Message(
                    text=response_text
                ),
                message_object,
                thread_id,
                thread_type
            )
            return

        if message.startswith(prf()) and thread_id not in load_duyetbox_data() and not is_admin(author_id):
            gui = Message(text="> Nhóm của bạn chưa được duyệt!\n> Để dùng được bot vui lòng liên hệ đến Admin để được duyệt và dùng bot.")
            self.client.replyMessage(gui, message_object, thread_id, thread_type, ttl=120000)
            return

        if message.startswith(prf() + 'adminmode'):
            self.toggle_admin_mode(message, message_object, thread_id, thread_type, author_id)
            return

        noprefix_command_handler = self.noprefix_szl.get(message.lower())
        if noprefix_command_handler:
            noprefix_command_handler(message, message_object, thread_id, thread_type, author_id, self.client)
            return

        if not message.startswith(prf()):
            return
            
        command_name = message[len(prf()):].split(' ')[0].lower()
        command_handler = self.szl.get(command_name)

        if self.adminon and not is_admin(author_id):
            error_message = "Chế độ admin đang bật, chỉ có admin mới có thể sử dụng lệnh."
            self.replyMessageColor(error_message, message_object, thread_id, thread_type)
            return

        if command_handler:
            command_handler(message, message_object, thread_id, thread_type, author_id, self.client)
        else:
            error_message = Message(text=f"Không tìm thấy lệnh: '{command_name}'. Hãy dùng {prf()}menu để biết các lệnh có trên hệ thống.")
            self.client.replyMessage(error_message, message_object, thread_id, thread_type, ttl=20000)
