import subprocess

def main():
    gen_cmd = [
        "python",                       
        "./compose_gen_for_py_37.py",                 
        "-e", "base.env",              
        "-t", "base.yml",              
        "--pack", "LOCAL_BUILD"        
    ]
    
    print("Generating a docker-compose file...")
    subprocess.run(gen_cmd, check=True)

    compose_cmd = [
        "docker", "compose",
        "-f", "dc-configs/compose.yml",        

        "--env-file", "cavise/scripts/environments/base.env",  
        "up", "-d"
    ]

    print("Running docker-compose...")
    subprocess.run(compose_cmd, check=True)

    print("Services in containers are running.")

if __name__ == "__main__":
    main()
